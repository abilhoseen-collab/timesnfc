import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initialState: T) => void;
  clearHistory: () => void;
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });
  
  const lastUpdateTimeRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    // Debounce rapid updates (like typing) - group them into single history entry
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setHistory((prev) => {
      const resolvedState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prev.present)
        : newState;

      // If the state hasn't actually changed, don't update history
      if (JSON.stringify(resolvedState) === JSON.stringify(prev.present)) {
        return prev;
      }

      // If updates are happening rapidly, replace the present instead of adding to history
      if (timeSinceLastUpdate < 500 && prev.past.length > 0) {
        return {
          ...prev,
          present: resolvedState,
          future: [], // Clear future on new change
        };
      }

      // Normal update - add current state to past
      const newPast = [...prev.past, prev.present].slice(-maxHistory);
      
      return {
        past: newPast,
        present: resolvedState,
        future: [], // Clear future on new change
      };
    });

    lastUpdateTimeRef.current = now;
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const newPresent = prev.past[prev.past.length - 1];
      const newFuture = [prev.present, ...prev.future];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = prev.future.slice(1);
      const newPresent = prev.future[0];
      const newPast = [...prev.past, prev.present];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((initialState: T) => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((prev) => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
    clearHistory,
  };
}

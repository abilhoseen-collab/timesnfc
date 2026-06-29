import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Flags = Record<string, boolean>;

let cached: Flags | null = null;
let pending: Promise<Flags> | null = null;

async function loadFlags(): Promise<Flags> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async () => {
    const { data } = await (supabase as any).from('feature_flags').select('key, enabled');
    const out: Flags = {};
    (data || []).forEach((r: any) => { out[r.key] = !!r.enabled; });
    cached = out;
    return out;
  })();
  return pending;
}

export function useFeatureFlag(key: string, defaultValue = false) {
  const [enabled, setEnabled] = useState(defaultValue);
  useEffect(() => {
    loadFlags().then((f) => {
      if (key in f) setEnabled(f[key]);
    });
  }, [key]);
  return enabled;
}

export function useAllFlags() {
  const [flags, setFlags] = useState<Flags>({});
  useEffect(() => { loadFlags().then(setFlags); }, []);
  return flags;
}

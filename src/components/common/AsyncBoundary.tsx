import { ReactNode, Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingState } from "./LoadingState";

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingVariant?: "spinner" | "list" | "card" | "page";
  loadingLabel?: string;
}

/** Combines ErrorBoundary + Suspense so individual tabs/sections can fail
 *  without blanking the whole page. */
export function AsyncBoundary({
  children,
  fallback,
  loadingVariant = "spinner",
  loadingLabel,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback ?? <LoadingState variant={loadingVariant} label={loadingLabel} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

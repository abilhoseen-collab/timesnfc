import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  variant?: "spinner" | "list" | "card" | "page";
  label?: string;
  rows?: number;
  className?: string;
}

export function LoadingState({
  variant = "spinner",
  label = "লোড হচ্ছে...",
  rows = 3,
  className = "",
}: LoadingStateProps) {
  if (variant === "spinner") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center justify-center gap-2 py-8 text-muted-foreground ${className}`}
      >
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">{label}</span>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-live="polite" aria-label={label}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // page
  return (
    <div
      role="status"
      aria-live="polite"
      className={`min-h-[50vh] flex items-center justify-center ${className}`}
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

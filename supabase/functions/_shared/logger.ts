// Structured JSON logger for Supabase Edge Functions.
// Every line is a single JSON object so Supabase log search + downstream
// tools (Logflare, Datadog, etc.) can parse them consistently.

type Level = "info" | "warn" | "error" | "debug";

function emit(level: Level, fn: string, event: string, meta: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    fn,
    event,
    ...meta,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logInfo(fn: string, event: string, meta: Record<string, unknown> = {}) {
  emit("info", fn, event, meta);
}

export function logWarn(fn: string, event: string, meta: Record<string, unknown> = {}) {
  emit("warn", fn, event, meta);
}

export function logDebug(fn: string, event: string, meta: Record<string, unknown> = {}) {
  emit("debug", fn, event, meta);
}

export function logError(
  fn: string,
  event: string,
  err: unknown,
  meta: Record<string, unknown> = {},
) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  emit("error", fn, event, { message, stack, ...meta });
}

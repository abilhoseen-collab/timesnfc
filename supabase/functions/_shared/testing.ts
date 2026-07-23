// Small helpers for edge function integration tests.
// Loads .env from repo root so VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
// are available without hardcoding.
import "https://deno.land/std@0.224.0/dotenv/load.ts";

export const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
export const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  "";

export function fnUrl(name: string): string {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL missing — check .env");
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${name}`;
}

export async function callFn(
  name: string,
  init: RequestInit & { auth?: string | null } = {},
): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (init.auth === undefined) {
    if (ANON_KEY) headers.set("Authorization", `Bearer ${ANON_KEY}`);
  } else if (init.auth) {
    headers.set("Authorization", `Bearer ${init.auth}`);
  }
  if (ANON_KEY) headers.set("apikey", ANON_KEY);
  const res = await fetch(fnUrl(name), { ...init, headers });
  return res;
}

export async function jsonOf(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

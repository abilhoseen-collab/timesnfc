// Handler wrapper providing: CORS, structured request/response logging,
// unified error mapping, and typed JSON parsing with zod validation.
//
// Usage:
//   import { withHandler, json, parseJson } from "../_shared/handler.ts";
//   import { z } from "npm:zod@3.23.8";
//   const Body = z.object({ id: z.string().uuid() });
//   Deno.serve(withHandler("my-fn", async (req, ctx) => {
//     const { id } = await parseJson(req, Body);
//     return json({ ok: true, id, requestId: ctx.requestId });
//   }));

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import type { ZodTypeAny, z } from "npm:zod@3.23.8";
import { HttpError, friendlyError } from "./errors.ts";
import { logInfo, logError } from "./logger.ts";

export const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers ?? {}) },
  });
}

export interface HandlerContext {
  requestId: string;
  startedAt: number;
}

export type Handler = (req: Request, ctx: HandlerContext) => Promise<Response>;

export function withHandler(fnName: string, handler: Handler) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const ctx: HandlerContext = { requestId, startedAt };

    logInfo(fnName, "request.start", {
      requestId,
      method: req.method,
      path: new URL(req.url).pathname,
    });

    try {
      const res = await handler(req, ctx);
      logInfo(fnName, "request.end", {
        requestId,
        status: res.status,
        ms: Date.now() - startedAt,
      });
      // Ensure request id is discoverable client-side for support tickets
      const merged = new Headers(res.headers);
      if (!merged.has("X-Request-Id")) merged.set("X-Request-Id", requestId);
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: merged,
      });
    } catch (err) {
      logError(fnName, "request.error", err, {
        requestId,
        ms: Date.now() - startedAt,
      });
      const { status, body } = friendlyError(err);
      return json(
        { ...body, requestId },
        { status, headers: { "X-Request-Id": requestId } },
      );
    }
  };
}

/** Parse and validate a JSON request body against a zod schema. */
export async function parseJson<T extends ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "INVALID_JSON", "অনুরোধের JSON ভুল ফরম্যাটে আছে।");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "ইনপুট যাচাইয়ে ব্যর্থ — সব ঘর সঠিকভাবে পূরণ করুন।",
      result.error.flatten().fieldErrors,
    );
  }
  return result.data;
}

/** Parse and validate query string parameters against a zod schema. */
export function parseQuery<T extends ZodTypeAny>(
  req: Request,
  schema: T,
): z.infer<T> {
  const params: Record<string, string> = {};
  const url = new URL(req.url);
  url.searchParams.forEach((v, k) => (params[k] = v));
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Query parameter যাচাইয়ে ব্যর্থ।",
      result.error.flatten().fieldErrors,
    );
  }
  return result.data;
}

/** Require a `Bearer` JWT and return the raw token; throws 401 otherwise. */
export function requireBearer(req: Request): string {
  const h = req.headers.get("Authorization") ?? "";
  if (!h.startsWith("Bearer ")) {
    throw new HttpError(401, "UNAUTHORIZED", "অনুমতি নেই — আবার লগইন করুন।");
  }
  const token = h.slice("Bearer ".length).trim();
  if (!token) throw new HttpError(401, "UNAUTHORIZED", "অনুমতি নেই — আবার লগইন করুন।");
  return token;
}

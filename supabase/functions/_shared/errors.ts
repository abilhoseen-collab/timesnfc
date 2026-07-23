// Central error mapping for edge functions.
// Public errors are surfaced with a Bengali user-friendly message plus a
// stable machine `code` and HTTP status. Unknown errors default to 500 and
// never leak internal messages/stack traces to the client.

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type FriendlyResponse = {
  status: number;
  body: { error: string; code: string; details?: unknown };
};

/**
 * Map any thrown value to a safe, user-facing response.
 * Bengali messages match the app-wide `getUserFriendlyError` conventions.
 */
export function friendlyError(err: unknown): FriendlyResponse {
  if (err instanceof HttpError) {
    return {
      status: err.status,
      body: { error: err.message, code: err.code, details: err.details },
    };
  }
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const msg = raw.toLowerCase();

  if (/rate.?limit|too many requests|429/.test(msg)) {
    return {
      status: 429,
      body: { error: "অনেক বেশি অনুরোধ। কিছুক্ষণ পরে আবার চেষ্টা করুন।", code: "RATE_LIMITED" },
    };
  }
  if (/quota|credits? exhausted|payment required|402/.test(msg)) {
    return {
      status: 402,
      body: { error: "ক্রেডিট বা কোটা শেষ। অ্যাডমিনের সাথে যোগাযোগ করুন।", code: "QUOTA_EXCEEDED" },
    };
  }
  if (/unauthori[sz]ed|invalid.*token|jwt|401/.test(msg)) {
    return {
      status: 401,
      body: { error: "অনুমতি নেই — আবার লগইন করুন।", code: "UNAUTHORIZED" },
    };
  }
  if (/forbidden|permission|not allowed|403/.test(msg)) {
    return {
      status: 403,
      body: { error: "এই কাজটি করার অনুমতি নেই।", code: "FORBIDDEN" },
    };
  }
  if (/not found|no rows|404/.test(msg)) {
    return { status: 404, body: { error: "তথ্য পাওয়া যায়নি।", code: "NOT_FOUND" } };
  }
  if (/timeout|timed out|deadline/.test(msg)) {
    return {
      status: 504,
      body: { error: "সার্ভার দেরি করছে — পরে আবার চেষ্টা করুন।", code: "TIMEOUT" },
    };
  }
  if (/network|fetch failed|econn|dns/.test(msg)) {
    return {
      status: 502,
      body: { error: "বাহ্যিক সার্ভিসে সংযোগ ব্যর্থ।", code: "UPSTREAM_ERROR" },
    };
  }
  return {
    status: 500,
    body: { error: "একটি ত্রুটি ঘটেছে। কিছুক্ষণ পরে চেষ্টা করুন।", code: "INTERNAL" },
  };
}

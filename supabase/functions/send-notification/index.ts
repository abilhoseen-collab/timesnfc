import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.23.8";
import { withHandler, parseJson, json } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { zUUID } from "../_shared/validate.ts";
import { logInfo, logError } from "../_shared/logger.ts";

// In-memory best-effort rate limit (10/hour per vcard).
const MAX_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;
const bucket = new Map<string, { count: number; resetAt: number }>();

function checkRate(id: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = bucket.get(id);
  if (!entry || now > entry.resetAt) {
    bucket.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_PER_HOUR - 1 };
  }
  if (entry.count >= MAX_PER_HOUR) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: MAX_PER_HOUR - entry.count };
}

const Body = z.object({
  vcard_id: zUUID,
  event_type: z.enum(["view", "link_click"]),
  link_name: z.string().trim().max(100).optional(),
});

Deno.serve(withHandler("send-notification", async (req, ctx) => {
  const { vcard_id, event_type, link_name } = await parseJson(req, Body);

  const rate = checkRate(vcard_id);
  if (!rate.allowed) {
    logInfo("send-notification", "rate.limited", { requestId: ctx.requestId, vcard_id });
    throw new HttpError(429, "RATE_LIMITED", "অনেক বেশি অনুরোধ। কিছুক্ষণ পরে আবার চেষ্টা করুন।");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  const { data: vcard, error: vcardError } = await supabase
    .from("vcards")
    .select("name, notification_email, notify_on_view, notify_on_click")
    .eq("id", vcard_id)
    .maybeSingle();
  if (vcardError) {
    logError("send-notification", "vcard.load", vcardError, { requestId: ctx.requestId });
    throw new HttpError(500, "DB_ERROR", "কার্ড লোড করা যায়নি।");
  }
  if (!vcard) throw new HttpError(404, "VCARD_NOT_FOUND", "কার্ড পাওয়া যায়নি।");

  const shouldNotify =
    (event_type === "view" && vcard.notify_on_view) ||
    (event_type === "link_click" && vcard.notify_on_click);

  if (!shouldNotify || !vcard.notification_email) {
    return json({ message: "Notification not required", requestId: ctx.requestId });
  }

  const sanitizedLinkName = link_name ? link_name.replace(/[<>'"&]/g, "").substring(0, 100) : "a link";
  const subject =
    event_type === "view"
      ? `🎉 Someone viewed your business card: ${vcard.name}`
      : `👆 Someone clicked a link on your card: ${vcard.name}`;
  const eventDescription =
    event_type === "view"
      ? "Your digital business card was just viewed!"
      : `Someone clicked the "${sanitizedLinkName}" on your digital business card!`;

  try {
    await resend.emails.send({
      from: "Notifications <onboarding@resend.dev>",
      to: [vcard.notification_email],
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 24px; background:#f5f5f5;">
          <h1 style="color:#0d9488;">${event_type === "view" ? "👀 New Card View!" : "🔗 Link Clicked!"}</h1>
          <p>${eventDescription}</p>
          <p><strong>Card:</strong> ${(vcard.name || "").replace(/[<>]/g, "")}</p>
          <p style="color:#6b7280;">Time: ${new Date().toLocaleString()}</p>
        </div>`,
    });
  } catch (e) {
    logError("send-notification", "resend.send", e, { requestId: ctx.requestId });
    throw new HttpError(502, "EMAIL_SEND_FAILED", "ইমেইল পাঠাতে ব্যর্থ।");
  }

  logInfo("send-notification", "sent", { requestId: ctx.requestId, event_type, remaining: rate.remaining });
  return json({ success: true, remaining: rate.remaining, requestId: ctx.requestId }, {
    headers: { "X-RateLimit-Remaining": String(rate.remaining) },
  });
}));

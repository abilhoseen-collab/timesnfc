import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { z } from "npm:zod@3.23.8";
import { withHandler, parseJson, json } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { zUUID } from "../_shared/validate.ts";
import { logInfo, logError } from "../_shared/logger.ts";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:support@example.com";
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const Body = z.object({
  user_id: zUUID.optional(),
  test: z.boolean().optional(),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(500).optional(),
  url: z.string().trim().max(500).optional(),
  tag: z.string().trim().max(80).optional(),
});

Deno.serve(withHandler("send-web-push", async (req, ctx) => {
  const payload = await parseJson(req, Body);
  let targetUserId = payload.user_id;

  if (payload.test) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new HttpError(401, "UNAUTHORIZED", "অনুমতি নেই — আবার লগইন করুন।");
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await userClient.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new HttpError(401, "UNAUTHORIZED", "অনুমতি নেই — আবার লগইন করুন।");
    }
    targetUserId = data.claims.sub;
  }

  if (!targetUserId) throw new HttpError(400, "MISSING_USER_ID", "user_id প্রয়োজন।");

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  if (!payload.test) {
    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("push_new_lead")
      .eq("user_id", targetUserId)
      .maybeSingle();
    if (prefs && prefs.push_new_lead === false) {
      return json({ skipped: "user opted out", requestId: ctx.requestId });
    }
  }

  const { data: subs, error: subsErr } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", targetUserId);
  if (subsErr) {
    logError("send-web-push", "db.subscriptions", subsErr, { requestId: ctx.requestId });
    throw new HttpError(500, "DB_ERROR", "Push subscriptions লোড করা যায়নি।");
  }
  if (!subs || subs.length === 0) {
    return json({ success: false, error: "No subscriptions", requestId: ctx.requestId });
  }

  const notificationPayload = JSON.stringify({
    title: payload.title || (payload.test ? "✅ টেস্ট নোটিফিকেশন" : "নতুন আপডেট"),
    body: payload.body || (payload.test ? "Web Push ঠিকঠাক কাজ করছে।" : ""),
    url: payload.url || "/dashboard",
    tag: payload.tag || "general",
  });

  let sent = 0;
  let removed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        notificationPayload,
      );
      sent++;
      await admin
        .from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", s.id);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (err as any)?.statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
        removed++;
      } else {
        logError("send-web-push", "push.send", err, { requestId: ctx.requestId, status });
      }
    }
  }

  logInfo("send-web-push", "summary", { requestId: ctx.requestId, sent, removed });
  return json({ success: sent > 0, sent, removed, requestId: ctx.requestId });
}));

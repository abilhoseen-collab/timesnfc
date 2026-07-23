import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { withHandler, json } from "../_shared/handler.ts";
import { logInfo, logError } from "../_shared/logger.ts";

Deno.serve(withHandler("subscription-expiry-notification", async (_req, ctx) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  const now = new Date();
  const sixDays = new Date(now.getTime() + 6 * 86400 * 1000).toISOString();
  const sevenDays = new Date(now.getTime() + 7 * 86400 * 1000).toISOString();

  const { data: expiring, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, user_id, expires_at, package_id, packages(name)")
    .eq("status", "approved")
    .gte("expires_at", sixDays)
    .lte("expires_at", sevenDays);

  if (fetchError) {
    logError("subscription-expiry-notification", "db.subscriptions", fetchError, { requestId: ctx.requestId });
    return json({ error: "Subscription lookup ব্যর্থ", code: "DB_ERROR" }, { status: 500 });
  }

  if (!expiring || expiring.length === 0) {
    return json({ message: "No subscriptions expiring in 7 days", sent: 0, requestId: ctx.requestId });
  }

  const userIds = expiring.map((s) => s.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  let failed = 0;

  for (const sub of expiring) {
    const profile = profileMap.get(sub.user_id);
    if (!profile?.email) continue;
    const userName = profile.full_name || "User";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packageName = (sub.packages as any)?.name || "Your subscription";
    const expiryDate = new Date(sub.expires_at).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    try {
      await resend.emails.send({
        from: "Times Digital <noreply@timesdigital.com>",
        to: [profile.email],
        subject: "⏰ আপনার সাবস্ক্রিপশন ৭ দিনের মধ্যে শেষ হবে - Times Digital",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#14b8a6,#0d9488);padding:24px;text-align:center;border-radius:10px 10px 0 0">
              <h1 style="color:#fff;margin:0">⏰ সাবস্ক্রিপশন এক্সপায়ারি নোটিস</h1>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
              <p>প্রিয় <strong>${userName.replace(/[<>]/g, "")}</strong>,</p>
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:16px 0">
                <strong>⚠️</strong> আপনার <strong>${packageName.replace(/[<>]/g, "")}</strong> প্যাকেজ <strong>${expiryDate}</strong> তারিখে শেষ হবে।
              </div>
              <p>আপনার সার্ভিস নিরবচ্ছিন্ন রাখতে সময়মত রিনিউ করুন।</p>
              <div style="text-align:center;margin:24px 0">
                <a href="https://timesnfc.lovable.app/dashboard" style="background:#14b8a6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">এখনই রিনিউ করুন</a>
              </div>
            </div>
          </div>`,
      });
      sent++;
    } catch (err) {
      logError("subscription-expiry-notification", "email.send", err, {
        requestId: ctx.requestId,
        email: profile.email,
      });
      failed++;
    }
  }

  logInfo("subscription-expiry-notification", "summary", { requestId: ctx.requestId, total: expiring.length, sent, failed });
  return json({
    message: "Subscription expiry notifications sent",
    total: expiring.length,
    sent,
    failed,
    requestId: ctx.requestId,
  });
}));

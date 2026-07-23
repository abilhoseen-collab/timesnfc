import { createClient } from "npm:@supabase/supabase-js@2";
import { withHandler, json } from "../_shared/handler.ts";
import { logInfo, logError } from "../_shared/logger.ts";

// Sends follow-up reminders to vCard owners when a lead's follow_up_at has passed.
// Designed to run on a 30-minute cron schedule.
Deno.serve(withHandler("lead-followup-reminders", async (_req, ctx) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from("vcard_leads")
    .select(
      "id, visitor_name, visitor_email, visitor_phone, message, status, user_id, vcards(name)",
    )
    .lte("follow_up_at", nowIso)
    .is("follow_up_sent_at", null)
    .limit(100);

  if (error) {
    logError("lead-followup-reminders", "db.select", error, { requestId: ctx.requestId });
    return json({ error: "Lead lookup ব্যর্থ", code: "DB_ERROR" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const r of rows ?? []) {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", r.user_id)
        .maybeSingle();
      if (!prof?.email) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vc: any = r.vcards;
      const html = `
        <h2>Follow-up reminder</h2>
        <p>হাই ${prof.full_name || ""},</p>
        <p>আপনি এই Lead-এর জন্য follow-up reminder সেট করেছিলেন:</p>
        <ul>
          <li><strong>Name:</strong> ${r.visitor_name || "-"}</li>
          <li><strong>Email:</strong> ${r.visitor_email || "-"}</li>
          <li><strong>Phone:</strong> ${r.visitor_phone || "-"}</li>
          <li><strong>Card:</strong> ${vc?.name || "-"}</li>
        </ul>
        <p><em>Message:</em> ${r.message || ""}</p>
      `;

      if (RESEND_API_KEY && LOVABLE_API_KEY) {
        const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Follow-up <onboarding@resend.dev>",
            to: [prof.email],
            subject: `⏰ Follow-up: ${r.visitor_name || "Lead"}`,
            html,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`resend ${res.status}: ${body}`);
        }
      }

      await supabase
        .from("vcard_leads")
        .update({ follow_up_sent_at: nowIso })
        .eq("id", r.id);

      await supabase.from("notifications").insert({
        user_id: r.user_id,
        title: "Follow-up reminder",
        message: `${r.visitor_name || "একটি lead"}-এর জন্য follow-up করার সময় হয়েছে`,
        type: "lead",
        link: "/leads",
      });
      sent++;
    } catch (e) {
      logError("lead-followup-reminders", "send.failed", e, { requestId: ctx.requestId, id: r.id });
      failed++;
    }
  }

  logInfo("lead-followup-reminders", "summary", {
    requestId: ctx.requestId,
    checked: rows?.length ?? 0,
    sent,
    failed,
  });

  return json({ checked: rows?.length ?? 0, sent, failed });
}));

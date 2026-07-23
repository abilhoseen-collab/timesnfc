import { createClient } from "npm:@supabase/supabase-js@2";
import { withHandler, json } from "../_shared/handler.ts";
import { logInfo, logError } from "../_shared/logger.ts";

// Sends 24h-before reminder emails for upcoming appointments.
// Designed to be run on a 15-minute schedule.
Deno.serve(withHandler("appointment-reminders", async (_req, ctx) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const now = new Date();
  const windowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("vcard_appointments")
    .select(
      "id, vcard_id, visitor_name, visitor_email, appointment_date, appointment_time, notes, status, reminder_sent_at, vcards(name, meeting_link, email)",
    )
    .gte("appointment_date", windowStart.split("T")[0])
    .lte("appointment_date", windowEnd.split("T")[0])
    .is("reminder_sent_at", null)
    .neq("status", "cancelled")
    .limit(100);

  if (error) {
    logError("appointment-reminders", "db.select", error, { requestId: ctx.requestId });
    return json({ error: "Appointment lookup ব্যর্থ", code: "DB_ERROR" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const r of rows ?? []) {
    const apptDt = new Date(`${r.appointment_date}T${r.appointment_time}`);
    const diffH = (apptDt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffH < 22 || diffH > 26) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vc: any = r.vcards;
    const html = `
      <h2>Reminder: আপনার appointment ২৪ ঘণ্টার মধ্যে</h2>
      <p>প্রিয় ${r.visitor_name},</p>
      <p><strong>${vc?.name || "আমাদের সাথে"}</strong> আপনার appointment আসছে:</p>
      <ul>
        <li><strong>Date:</strong> ${r.appointment_date}</li>
        <li><strong>Time:</strong> ${r.appointment_time}</li>
        ${vc?.meeting_link ? `<li><strong>Meeting Link:</strong> <a href="${vc.meeting_link}">${vc.meeting_link}</a></li>` : ""}
        ${r.notes ? `<li><strong>Notes:</strong> ${r.notes}</li>` : ""}
      </ul>
      <p>ধন্যবাদ!</p>
    `;

    try {
      if (RESEND_API_KEY && LOVABLE_API_KEY && r.visitor_email) {
        const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Reminders <onboarding@resend.dev>",
            to: [r.visitor_email],
            subject: `Reminder: Appointment with ${vc?.name || "us"} tomorrow`,
            html,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`resend ${res.status}: ${body}`);
        }
      }
      await supabase
        .from("vcard_appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", r.id);
      sent++;
    } catch (e) {
      logError("appointment-reminders", "send.failed", e, { requestId: ctx.requestId, id: r.id });
      failed++;
    }
  }

  logInfo("appointment-reminders", "summary", {
    requestId: ctx.requestId,
    checked: rows?.length ?? 0,
    sent,
    failed,
  });

  return json({ checked: rows?.length ?? 0, sent, failed });
}));

import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.23.8";
import { withHandler, parseJson, json } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { zEmail, zUUID, zPhone } from "../_shared/validate.ts";
import { logInfo, logError } from "../_shared/logger.ts";

const Body = z.object({
  vcard_id: zUUID,
  appointment_id: zUUID,
  visitor_name: z.string().trim().min(1).max(120),
  visitor_email: zEmail,
  visitor_phone: zPhone.optional(),
  appointment_date: z.string().min(1).max(20),
  appointment_time: z.string().min(1).max(20),
  notes: z.string().trim().max(2000).optional(),
});

Deno.serve(withHandler("send-appointment-notification", async (req, ctx) => {
  const payload = await parseJson(req, Body);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  const { data: vcard, error: vcardError } = await supabase
    .from("vcards")
    .select("name, email, appointment_email, appointment_title")
    .eq("id", payload.vcard_id)
    .maybeSingle();

  if (vcardError) {
    logError("send-appointment-notification", "vcard.load", vcardError, { requestId: ctx.requestId });
    throw new HttpError(500, "DB_ERROR", "কার্ড লোড করা যায়নি।");
  }
  if (!vcard) throw new HttpError(404, "VCARD_NOT_FOUND", "কার্ড পাওয়া যায়নি।");

  const ownerEmail = vcard.appointment_email || vcard.email;
  if (!ownerEmail) {
    logInfo("send-appointment-notification", "no.owner.email", { requestId: ctx.requestId });
    return json({ message: "No email configured", requestId: ctx.requestId });
  }

  const formattedDate = new Date(payload.appointment_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const escape = (s: string) => s.replace(/[<>]/g, "");
  const nm = escape(payload.visitor_name);
  const em = escape(payload.visitor_email);
  const ph = payload.visitor_phone ? escape(payload.visitor_phone) : "";
  const notes = payload.notes ? escape(payload.notes) : "";

  const ownerHtml = `
    <div style="font-family: sans-serif; padding: 24px; background: #f5f5f5;">
      <h1 style="color:#6366f1;">📅 New Appointment Booked!</h1>
      <ul>
        <li>Client: <strong>${nm}</strong></li>
        <li>Email: ${em}</li>
        ${ph ? `<li>Phone: ${ph}</li>` : ""}
        <li>Date: ${formattedDate}</li>
        <li>Time: ${payload.appointment_time}</li>
      </ul>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      <p style="color:#666;">${escape(vcard.appointment_title || "Appointment")} — ${escape(vcard.name || "")}</p>
    </div>`;

  const visitorHtml = `
    <div style="font-family: sans-serif; padding: 24px; background: #f5f5f5;">
      <h1 style="color:#10b981;">✅ Appointment Confirmed!</h1>
      <p>Hi ${nm},</p>
      <p>Your appointment with <strong>${escape(vcard.name || "")}</strong> is booked for <strong>${formattedDate} at ${payload.appointment_time}</strong>.</p>
    </div>`;

  try {
    await resend.emails.send({
      from: "Appointments <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: `📅 New Appointment: ${nm} - ${formattedDate}`,
      html: ownerHtml,
    });
    await resend.emails.send({
      from: "Appointments <onboarding@resend.dev>",
      to: [payload.visitor_email],
      subject: `✅ Appointment Confirmed with ${vcard.name}`,
      html: visitorHtml,
    });
  } catch (e) {
    logError("send-appointment-notification", "resend.send", e, { requestId: ctx.requestId });
    throw new HttpError(502, "EMAIL_SEND_FAILED", "ইমেইল পাঠাতে ব্যর্থ।");
  }

  logInfo("send-appointment-notification", "sent", { requestId: ctx.requestId });
  return json({ success: true, requestId: ctx.requestId });
}));

import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.23.8";
import { withHandler, parseJson, json } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { zEmail, zUUID, zPhone } from "../_shared/validate.ts";
import { logInfo, logError } from "../_shared/logger.ts";

const Body = z.object({
  vcard_id: zUUID,
  visitor_name: z.string().trim().min(1).max(120),
  visitor_email: zEmail,
  visitor_phone: zPhone.optional(),
  message: z.string().trim().min(1).max(2000),
});

Deno.serve(withHandler("send-contact-notification", async (req, ctx) => {
  const payload = await parseJson(req, Body);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  const { data: vcard, error: vcardError } = await supabase
    .from("vcards")
    .select("name, email, notification_email, user_id")
    .eq("id", payload.vcard_id)
    .maybeSingle();
  if (vcardError) {
    logError("send-contact-notification", "vcard.load", vcardError, { requestId: ctx.requestId });
    throw new HttpError(500, "DB_ERROR", "কার্ড লোড করা যায়নি।");
  }
  if (!vcard) throw new HttpError(404, "VCARD_NOT_FOUND", "কার্ড পাওয়া যায়নি।");

  const ownerEmail = vcard.notification_email || vcard.email;
  if (!ownerEmail) {
    logInfo("send-contact-notification", "no.owner.email", { requestId: ctx.requestId });
    return json({ message: "No email configured", requestId: ctx.requestId });
  }

  const escape = (s: string) => s.replace(/[<>]/g, "");
  const nm = escape(payload.visitor_name);
  const em = escape(payload.visitor_email);
  const ph = payload.visitor_phone ? escape(payload.visitor_phone) : "";
  const msg = escape(payload.message).substring(0, 2000);

  const html = `
    <div style="font-family: sans-serif; padding: 24px; background: #f5f5f5;">
      <h1 style="color:#3b82f6;">💬 New Contact Message</h1>
      <ul>
        <li>Name: <strong>${nm}</strong></li>
        <li>Email: <a href="mailto:${em}">${em}</a></li>
        ${ph ? `<li>Phone: ${ph}</li>` : ""}
      </ul>
      <div style="background:#eff6ff; padding:16px; border-radius:8px; white-space: pre-wrap;">${msg}</div>
      <p style="color:#666;">Card: ${escape(vcard.name || "")}</p>
    </div>`;

  try {
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: [ownerEmail],
      reply_to: payload.visitor_email,
      subject: `💬 New Message from ${nm}`,
      html,
    });
  } catch (e) {
    logError("send-contact-notification", "resend.send", e, { requestId: ctx.requestId });
    throw new HttpError(502, "EMAIL_SEND_FAILED", "ইমেইল পাঠাতে ব্যর্থ।");
  }

  if (vcard.user_id) {
    try {
      await supabase.functions.invoke("send-web-push", {
        body: {
          user_id: vcard.user_id,
          title: "📥 নতুন Lead",
          body: `${nm} আপনার কার্ডে যোগাযোগ করেছেন`,
          url: "/leads",
          tag: "new-lead",
        },
      });
    } catch (pushErr) {
      logError("send-contact-notification", "push.dispatch", pushErr, { requestId: ctx.requestId });
    }
  }

  logInfo("send-contact-notification", "sent", { requestId: ctx.requestId });
  return json({ success: true, requestId: ctx.requestId });
}));

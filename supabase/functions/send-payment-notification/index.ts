import { Resend } from "npm:resend@2.0.0";
import { z } from "npm:zod@3.23.8";
import { withHandler, parseJson, json } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { zEmail } from "../_shared/validate.ts";
import { logInfo, logError } from "../_shared/logger.ts";

const Body = z.object({
  type: z.enum(["approved", "rejected"]),
  userEmail: zEmail,
  userName: z.string().trim().max(120).optional().default(""),
  packageName: z.string().trim().min(1).max(120),
  amount: z.number().finite().nonnegative(),
  expiresAt: z.string().optional(),
  adminNotes: z.string().trim().max(2000).optional(),
  isNfcOrder: z.boolean().optional(),
});

Deno.serve(withHandler("send-payment-notification", async (req, ctx) => {
  const { type, userEmail, userName, packageName, amount, expiresAt, adminNotes, isNfcOrder } =
    await parseJson(req, Body);
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  const esc = (s: string) => s.replace(/[<>]/g, "");
  const name = esc(userName || "Valued Customer");
  const pkg = esc(packageName);
  const notes = adminNotes ? esc(adminNotes) : "";

  let subject: string;
  let html: string;

  if (isNfcOrder) {
    if (type === "approved") {
      subject = "🎉 NFC Card Order Approved - Ready to Register!";
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h1 style="color:#10b981">Order Approved! 🎉</h1>
          <p>Dear ${name},</p>
          <p>Your NFC card payment has been verified and approved.</p>
          <p><strong>Product:</strong> ${pkg}<br/><strong>Amount:</strong> ৳${amount}</p>
          <p><a href="https://timesnfc.lovable.app/auth?email=${encodeURIComponent(userEmail)}" style="background:#10b981;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none">Register Now →</a></p>
          <p>Best regards,<br/><strong>Times Digital Team</strong></p>
        </div>`;
    } else {
      subject = "NFC Card Order Update - Action Required";
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h1 style="color:#ef4444">Order Could Not Be Processed</h1>
          <p>Dear ${name},</p>
          <p>We were unable to verify your payment for <strong>${pkg}</strong> (৳${amount}).</p>
          ${notes ? `<div style="background:#fef2f2;padding:16px;border-left:4px solid #ef4444"><strong>Reason:</strong> ${notes}</div>` : ""}
          <p>Best regards,<br/><strong>Times Digital Team</strong></p>
        </div>`;
    }
  } else {
    if (type === "approved") {
      subject = `🎉 Payment Approved - ${pkg} Plan Activated!`;
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#10b981">Payment Approved! 🎉</h1>
          <p>Dear ${name},</p>
          <p><strong>Plan:</strong> ${pkg}<br/><strong>Amount:</strong> ৳${amount}${
        expiresAt
          ? `<br/><strong>Valid Until:</strong> ${new Date(expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
          : ""
      }</p>
          <p>Best regards,<br/>The Team</p>
        </div>`;
    } else {
      subject = "Payment Status Update - Action Required";
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#ef4444">Payment Could Not Be Verified</h1>
          <p>Dear ${name},</p>
          <p>We were unable to verify your payment for the ${pkg} plan (৳${amount}).</p>
          ${notes ? `<div style="background:#fef2f2;padding:16px;border-left:4px solid #ef4444"><strong>Reason:</strong> ${notes}</div>` : ""}
          <p>Best regards,<br/>The Team</p>
        </div>`;
    }
  }

  try {
    const res = await resend.emails.send({
      from: "Times Digital <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html,
    });
    logInfo("send-payment-notification", "email.sent", { requestId: ctx.requestId, type, id: res.data?.id });
    return json({ success: true, requestId: ctx.requestId });
  } catch (e) {
    logError("send-payment-notification", "email.send", e, { requestId: ctx.requestId });
    throw new HttpError(502, "EMAIL_SEND_FAILED", "ইমেইল পাঠাতে ব্যর্থ।");
  }
}));

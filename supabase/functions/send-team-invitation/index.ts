// Sends a team invitation email via Resend.
import { withHandler, json, parseJson } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { logInfo } from "../_shared/logger.ts";
import { z, zEmail } from "../_shared/validate.ts";

const FN = "send-team-invitation";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const Body = z.object({
  invitationId: z.string().uuid(),
  email: zEmail,
  teamName: z.string().trim().max(200).optional(),
  inviterName: z.string().trim().max(200).optional(),
  role: z.string().trim().min(1).max(50),
  token: z.string().trim().min(10).max(200),
});

Deno.serve(withHandler(FN, async (req, ctx) => {
  const { email, teamName, inviterName, role, token } = await parseJson(req, Body);

  if (!RESEND_API_KEY) {
    throw new HttpError(500, "CONFIG_ERROR", "Email সার্ভিস কনফিগার করা নেই।");
  }

  const origin = req.headers.get("origin") || "https://timesnfc.lovable.app";
  const acceptUrl = `${origin}/accept-invite?token=${encodeURIComponent(token)}`;

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width:560px; margin:0 auto; padding:24px; background:#0f0f17; color:#fff;">
      <div style="background:linear-gradient(135deg,#7c3aed,#a855f7); padding:24px; border-radius:12px; text-align:center;">
        <h1 style="margin:0; font-size:24px;">🎉 Team Invitation</h1>
      </div>
      <div style="background:#1a1a24; padding:24px; border-radius:12px; margin-top:16px;">
        <p style="font-size:15px; line-height:1.6;">আপনাকে <strong>${teamName || "একটি team"}</strong>-এ <strong>${role}</strong> হিসেবে যুক্ত হওয়ার জন্য আমন্ত্রণ জানানো হয়েছে${inviterName ? ` <strong>${inviterName}</strong>-এর পক্ষ থেকে` : ""}।</p>
        <div style="text-align:center; margin:24px 0;">
          <a href="${acceptUrl}" style="display:inline-block; background:#a855f7; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600;">Invitation Accept করুন</a>
        </div>
        <p style="font-size:12px; color:#94a3b8;">এই link ৭ দিন valid থাকবে। যদি button কাজ না করে, এই URL browser-এ paste করুন:<br/><span style="word-break:break-all;">${acceptUrl}</span></p>
      </div>
      <p style="text-align:center; font-size:11px; color:#64748b; margin-top:16px;">TimesNFC · ${new Date().getFullYear()}</p>
    </div>
  `;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TimesNFC <noreply@timesnfc.lovable.app>",
      to: [email],
      subject: `${teamName || "Team"}-এ আপনার Invitation`,
      html,
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    logInfo(FN, "resend.error", { requestId: ctx.requestId, status: r.status, body: txt.slice(0, 500) });
    throw new HttpError(502, "EMAIL_SEND_FAILED", "Email পাঠাতে ব্যর্থ হয়েছে।");
  }
  return json({ ok: true });
}));

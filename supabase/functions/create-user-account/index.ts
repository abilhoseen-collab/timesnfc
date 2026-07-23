import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { withHandler, parseJson, json } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { zEmail, zUUID } from "../_shared/validate.ts";
import { logInfo, logError } from "../_shared/logger.ts";

const DEFAULT_PASSWORD = "112233";

const Body = z.object({
  email: zEmail,
  fullName: z.string().trim().min(1).max(120),
  packageName: z.string().trim().min(1).max(80),
  amount: z.number().finite().nonnegative(),
  expiresAt: z.string().datetime().optional(),
  subscriptionId: zUUID,
});

Deno.serve(withHandler("create-user-account", async (req, ctx) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const { email, fullName, packageName, amount, expiresAt, subscriptionId } = await parseJson(req, Body);

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    logError("create-user-account", "auth.listUsers", listErr, { requestId: ctx.requestId });
    throw new HttpError(500, "AUTH_LIST_FAILED", "ব্যবহারকারী তালিকা লোড করা যায়নি।");
  }
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  let userId: string;
  let isNewUser = false;

  if (existingUser) {
    userId = existingUser.id;
    logInfo("create-user-account", "user.exists", { requestId: ctx.requestId, userId });
  } else {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !newUser?.user) {
      logError("create-user-account", "auth.createUser", createError, { requestId: ctx.requestId });
      throw new HttpError(500, "AUTH_CREATE_FAILED", "নতুন অ্যাকাউন্ট তৈরিতে ব্যর্থ।");
    }
    userId = newUser.user.id;
    isNewUser = true;
    logInfo("create-user-account", "user.created", { requestId: ctx.requestId, userId });
  }

  const { error: subErr } = await supabaseAdmin
    .from("subscriptions")
    .update({ user_id: userId })
    .eq("id", subscriptionId);
  if (subErr) {
    logError("create-user-account", "subscription.update", subErr, { requestId: ctx.requestId });
    throw new HttpError(500, "SUBSCRIPTION_LINK_FAILED", "সাবস্ক্রিপশন লিংক করা যায়নি।");
  }

  const loginUrl = "https://timesnfc.lovable.app/auth";
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981; margin: 0;">🎉 Payment Approved!</h1>
        <p style="color: #666; font-size: 18px;">Your ${packageName} plan is now active</p>
      </div>
      <p style="font-size: 16px; color: #333;">Dear ${fullName || "Valued Customer"},</p>
      <p style="font-size: 16px; color: #333;">Great news! Your payment has been verified and your account is ready.</p>
      <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 25px; border-radius: 15px; margin: 25px 0; color: white;">
        <h3 style="margin-top: 0; font-size: 18px;">📦 Package Details</h3>
        <p style="margin: 8px 0;"><strong>Plan:</strong> ${packageName}</p>
        <p style="margin: 8px 0;"><strong>Amount Paid:</strong> ৳${amount}</p>
        ${expiresAt ? `<p style="margin: 8px 0;"><strong>Valid Until:</strong> ${new Date(expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
      </div>
      <div style="background: #f3f4f6; border: 2px solid #e5e7eb; padding: 25px; border-radius: 15px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #374151;">🔐 Your Login Credentials</h3>
        <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
          <p style="margin: 8px 0; color: #333;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0; color: #333;"><strong>Password:</strong> ${DEFAULT_PASSWORD}</p>
        </div>
        <p style="color: #ef4444; font-size: 14px; margin-bottom: 0;">⚠️ Please change your password after first login for security!</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">Login to Your Dashboard →</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">Best regards,<br><strong>Times Digital Team</strong></p>
    </div>
  `;

  if (RESEND_API_KEY) {
    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Times Digital <onboarding@resend.dev>",
          to: [email],
          subject: `🎉 ${packageName} Plan Activated - Your Login Credentials`,
          html: emailHtml,
        }),
      });
      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        logError("create-user-account", "email.send", errBody, { requestId: ctx.requestId, status: emailRes.status });
      } else {
        logInfo("create-user-account", "email.sent", { requestId: ctx.requestId });
      }
    } catch (e) {
      logError("create-user-account", "email.exception", e, { requestId: ctx.requestId });
    }
  }

  return json({
    success: true,
    userId,
    isNewUser,
    message: isNewUser ? "User created and email sent" : "Existing user linked and email sent",
    requestId: ctx.requestId,
  });
}));

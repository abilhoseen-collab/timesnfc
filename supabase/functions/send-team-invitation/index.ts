import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  invitationId: z.string().uuid(),
  email: z.string().email(),
  teamName: z.string().optional(),
  inviterName: z.string().optional(),
  role: z.string(),
  token: z.string(),
});

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const APP_URL = SUPABASE_URL.replace(".supabase.co", ".lovable.app");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { email, teamName, inviterName, role, token } = parsed.data;

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://timesnfc.lovable.app";
    const acceptUrl = `${origin}/accept-invite?token=${token}`;

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
      console.error("Resend error:", txt);
      return new Response(JSON.stringify({ error: "Email send failed", detail: txt }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

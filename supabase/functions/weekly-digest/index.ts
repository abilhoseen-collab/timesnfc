import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { withHandler, json } from "../_shared/handler.ts";
import { logInfo, logError } from "../_shared/logger.ts";

interface Stats {
  views: number;
  clicks: number;
  contacts: number;
  leads: number;
  topVcard: { name: string; views: number } | null;
}

async function statsForUser(admin: SupabaseClient, userId: string): Promise<Stats> {
  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

  const { data: vcards } = await admin
    .from("vcards")
    .select("id, name")
    .eq("user_id", userId);

  const vcardIds = (vcards ?? []).map((v) => v.id);
  if (vcardIds.length === 0) {
    return { views: 0, clicks: 0, contacts: 0, leads: 0, topVcard: null };
  }

  const { data: events } = await admin
    .from("vcard_analytics")
    .select("vcard_id, event_type")
    .in("vcard_id", vcardIds)
    .gte("created_at", since);

  const counts: Record<string, number> = {};
  const perCardViews: Record<string, number> = {};
  for (const e of events ?? []) {
    counts[e.event_type] = (counts[e.event_type] || 0) + 1;
    if (e.event_type === "view") {
      perCardViews[e.vcard_id] = (perCardViews[e.vcard_id] || 0) + 1;
    }
  }

  const { count: leadsCount } = await admin
    .from("vcard_leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  let topVcard: Stats["topVcard"] = null;
  let max = 0;
  for (const [id, n] of Object.entries(perCardViews)) {
    if (n > max) {
      max = n;
      const card = (vcards ?? []).find((v) => v.id === id);
      if (card) topVcard = { name: card.name, views: n };
    }
  }

  return {
    views: counts["view"] || 0,
    clicks: counts["link_click"] || 0,
    contacts: counts["contact_form"] || 0,
    leads: leadsCount || 0,
    topVcard,
  };
}

function emailHtml(name: string, s: Stats): string {
  const totalActivity = s.views + s.clicks + s.contacts + s.leads;
  const escName = name.replace(/[<>]/g, "");
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;margin:0;padding:0;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden">
  <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">📊 আপনার সাপ্তাহিক রিপোর্ট</h1>
  </td></tr>
  <tr><td style="padding:32px 28px">
    <p>আসসালামু আলাইকুম${escName ? " " + escName : ""},</p>
    <p style="color:#6b7280">আপনার digital business card এই সপ্তাহে <strong>${totalActivity}</strong> বার activity পেয়েছে।</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px">
      <tr>
        <td style="background:#eff6ff;border-radius:8px;padding:16px;text-align:center"><div style="color:#1e40af;font-size:28px;font-weight:700">${s.views}</div><div style="color:#6b7280;font-size:12px">Views</div></td>
        <td style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center"><div style="color:#15803d;font-size:28px;font-weight:700">${s.clicks}</div><div style="color:#6b7280;font-size:12px">Link clicks</div></td>
      </tr>
      <tr>
        <td style="background:#fef3c7;border-radius:8px;padding:16px;text-align:center"><div style="color:#a16207;font-size:28px;font-weight:700">${s.contacts}</div><div style="color:#6b7280;font-size:12px">Contact submissions</div></td>
        <td style="background:#fce7f3;border-radius:8px;padding:16px;text-align:center"><div style="color:#be185d;font-size:28px;font-weight:700">${s.leads}</div><div style="color:#6b7280;font-size:12px">নতুন Leads</div></td>
      </tr>
    </table>
    ${s.topVcard ? `<div style="background:#f9fafb;border-radius:8px;padding:16px;margin-top:20px"><div style="color:#6b7280;font-size:12px">🏆 সবচেয়ে জনপ্রিয় কার্ড</div><div style="color:#111827;font-weight:600">${s.topVcard.name.replace(/[<>]/g, "")}</div><div style="color:#6b7280;font-size:12px">${s.topVcard.views} views</div></div>` : ""}
    <div style="text-align:center;margin-top:24px"><a href="https://timesnfc.lovable.app/dashboard" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">ড্যাশবোর্ড দেখুন</a></div>
  </td></tr>
</table></body></html>`;
}

Deno.serve(withHandler("weekly-digest", async (_req, ctx) => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  const { data: prefs, error } = await admin
    .from("notification_preferences")
    .select("user_id")
    .eq("weekly_digest", true);
  if (error) {
    logError("weekly-digest", "prefs.load", error, { requestId: ctx.requestId });
    return json({ error: "Preferences লোড ব্যর্থ", code: "DB_ERROR" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  for (const p of prefs ?? []) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", p.user_id)
      .maybeSingle();
    if (!profile?.email) {
      skipped++;
      continue;
    }
    const stats = await statsForUser(admin, p.user_id);
    if (stats.views + stats.leads + stats.clicks + stats.contacts === 0) {
      skipped++;
      continue;
    }
    try {
      await resend.emails.send({
        from: "Weekly Digest <onboarding@resend.dev>",
        to: [profile.email],
        subject: `📊 আপনার সাপ্তাহিক রিপোর্ট — ${stats.views} views, ${stats.leads} leads`,
        html: emailHtml(profile.full_name || "", stats),
      });
      sent++;
    } catch (err) {
      logError("weekly-digest", "email.send", err, { requestId: ctx.requestId, email: profile.email });
    }
  }

  logInfo("weekly-digest", "summary", { requestId: ctx.requestId, sent, skipped });
  return json({ success: true, sent, skipped, requestId: ctx.requestId });
}));

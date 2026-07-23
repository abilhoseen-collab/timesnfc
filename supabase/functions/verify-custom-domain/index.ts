// Verifies a vCard custom domain via DNS TXT lookup.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withHandler, json, parseJson } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { logWarn } from "../_shared/logger.ts";
import { z, zUUID } from "../_shared/validate.ts";

const FN = "verify-custom-domain";
const Body = z.object({ domain_id: zUUID });

Deno.serve(withHandler(FN, async (req, ctx) => {
  const { domain_id } = await parseJson(req, Body);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: row, error } = await supabase
    .from("vcard_custom_domains")
    .select("*")
    .eq("id", domain_id)
    .maybeSingle();
  if (error) throw new HttpError(500, "DB_ERROR", "ডোমেইন তথ্য আনতে ব্যর্থ।", { detail: error.message });
  if (!row) throw new HttpError(404, "NOT_FOUND", "ডোমেইন খুঁজে পাওয়া যায়নি।");

  const dnsName = `_times-verify.${row.domain}`;
  let dns: any;
  try {
    const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(dnsName)}&type=TXT`);
    if (!dnsRes.ok) throw new Error(`dns.google returned ${dnsRes.status}`);
    dns = await dnsRes.json();
  } catch (e) {
    logWarn(FN, "dns.lookup.failed", { requestId: ctx.requestId, dnsName, err: String(e) });
    throw new HttpError(502, "DNS_LOOKUP_FAILED", "DNS lookup ব্যর্থ — কিছুক্ষণ পরে চেষ্টা করুন।");
  }

  const found = Array.isArray(dns.Answer) &&
    dns.Answer.some((a: any) => String(a?.data ?? "").includes(row.verification_token));

  const newStatus = found ? "verified" : "failed";
  const { error: updErr } = await supabase
    .from("vcard_custom_domains")
    .update({
      status: newStatus,
      verified_at: found ? new Date().toISOString() : null,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", domain_id);
  if (updErr) {
    throw new HttpError(500, "DB_UPDATE_FAILED", "ডোমেইন স্ট্যাটাস আপডেট করা যায়নি।", { detail: updErr.message });
  }

  return json({ verified: found, status: newStatus });
}));

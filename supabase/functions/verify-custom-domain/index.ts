// Verifies a vCard custom domain via DNS TXT lookup
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { domain_id } = await req.json();
    if (!domain_id) return new Response(JSON.stringify({ error: "domain_id required" }), { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: row } = await supabase
      .from("vcard_custom_domains")
      .select("*")
      .eq("id", domain_id)
      .single();
    if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });

    // Query DNS via Google DNS-over-HTTPS
    const dnsName = `_times-verify.${row.domain}`;
    const dnsRes = await fetch(`https://dns.google/resolve?name=${dnsName}&type=TXT`);
    const dns = await dnsRes.json();
    const found = (dns.Answer || []).some((a: any) =>
      String(a.data || "").includes(row.verification_token)
    );

    const newStatus = found ? "verified" : "failed";
    await supabase
      .from("vcard_custom_domains")
      .update({
        status: newStatus,
        verified_at: found ? new Date().toISOString() : null,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", domain_id);

    return new Response(JSON.stringify({ verified: found, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});

// Dispatches lead/appointment events to Zapier, Mailchimp, HubSpot.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withHandler, json, parseJson } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { logInfo, logWarn } from "../_shared/logger.ts";
import { z, zUUID } from "../_shared/validate.ts";

const FN = "dispatch-integrations";

const Body = z.object({
  vcard_id: zUUID,
  type: z.enum(["lead", "appointment"]),
  payload: z.record(z.unknown()).default({}),
});

async function safeCall<T>(label: string, requestId: string, fn: () => Promise<T>) {
  try {
    return { ok: true, value: await fn() } as const;
  } catch (e) {
    logWarn(FN, `${label}.failed`, { requestId, err: (e as Error).message });
    return { ok: false, error: (e as Error).message } as const;
  }
}

Deno.serve(withHandler(FN, async (req, ctx) => {
  const { vcard_id, type, payload } = await parseJson(req, Body);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: vc, error } = await supabase
    .from("vcards")
    .select("zapier_webhook_url, mailchimp_api_key, mailchimp_audience_id, hubspot_token, name")
    .eq("id", vcard_id)
    .maybeSingle();
  if (error) throw new HttpError(500, "DB_ERROR", "vCard আনতে ব্যর্থ।", { detail: error.message });
  if (!vc) throw new HttpError(404, "NOT_FOUND", "vCard পাওয়া যায়নি।");

  const p = payload as Record<string, any>;
  const email = (p.visitor_email ?? p.email) as string | undefined;
  const name = String(p.visitor_name ?? p.name ?? "");
  const phone = String(p.visitor_phone ?? p.phone ?? "");
  const [first_name, ...rest] = name.split(" ");
  const last_name = rest.join(" ");

  const results: Record<string, unknown> = {};

  if (vc.zapier_webhook_url) {
    results.zapier = await safeCall("zapier", ctx.requestId, async () => {
      const r = await fetch(vc.zapier_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          vcard_id,
          vcard_name: vc.name,
          timestamp: new Date().toISOString(),
          ...payload,
        }),
      });
      if (!r.ok) throw new Error(`zapier ${r.status}`);
      return "sent";
    });
  }

  if (vc.mailchimp_api_key && vc.mailchimp_audience_id && email) {
    results.mailchimp = await safeCall("mailchimp", ctx.requestId, async () => {
      const dc = String(vc.mailchimp_api_key).split("-")[1];
      if (!dc) throw new Error("mailchimp api key missing datacentre suffix");
      const r = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${vc.mailchimp_audience_id}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`anystring:${vc.mailchimp_api_key}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: email,
            status: "subscribed",
            merge_fields: { FNAME: first_name || "", LNAME: last_name || "", PHONE: phone || "" },
          }),
        },
      );
      if (!r.ok) throw new Error(`mailchimp ${r.status}`);
      return "subscribed";
    });
  }

  if (vc.hubspot_token && email) {
    results.hubspot = await safeCall("hubspot", ctx.requestId, async () => {
      const r = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vc.hubspot_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            email,
            firstname: first_name || "",
            lastname: last_name || "",
            phone,
            message: p.message || "",
          },
        }),
      });
      if (!r.ok) throw new Error(`hubspot ${r.status}`);
      return "created";
    });
  }

  logInfo(FN, "dispatch.complete", { requestId: ctx.requestId, vcard_id, providers: Object.keys(results) });
  return json({ ok: true, results });
}));

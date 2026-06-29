import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface DispatchBody {
  vcard_id: string;
  type: 'lead' | 'appointment';
  payload: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as DispatchBody;
    if (!body.vcard_id || !body.type) {
      return new Response(JSON.stringify({ error: 'vcard_id and type required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: vc } = await supabase
      .from('vcards')
      .select('zapier_webhook_url, mailchimp_api_key, mailchimp_audience_id, hubspot_token, name')
      .eq('id', body.vcard_id)
      .maybeSingle();

    if (!vc) {
      return new Response(JSON.stringify({ error: 'vcard not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = body.payload as Record<string, any>;
    const email = (payload.visitor_email || payload.email) as string | undefined;
    const name = (payload.visitor_name || payload.name || '') as string;
    const phone = (payload.visitor_phone || payload.phone || '') as string;
    const [first_name, ...rest] = name.split(' ');
    const last_name = rest.join(' ');

    const results: Record<string, any> = {};

    // 1) Zapier webhook
    if (vc.zapier_webhook_url) {
      try {
        await fetch(vc.zapier_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: body.type,
            vcard_id: body.vcard_id,
            vcard_name: vc.name,
            timestamp: new Date().toISOString(),
            ...payload,
          }),
        });
        results.zapier = 'sent';
      } catch (e) {
        results.zapier = `error: ${(e as Error).message}`;
      }
    }

    // 2) Mailchimp subscribe
    if (vc.mailchimp_api_key && vc.mailchimp_audience_id && email) {
      try {
        const dc = vc.mailchimp_api_key.split('-')[1];
        const res = await fetch(
          `https://${dc}.api.mailchimp.com/3.0/lists/${vc.mailchimp_audience_id}/members`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${btoa(`anystring:${vc.mailchimp_api_key}`)}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email_address: email,
              status: 'subscribed',
              merge_fields: { FNAME: first_name || '', LNAME: last_name || '', PHONE: phone || '' },
            }),
          },
        );
        results.mailchimp = res.ok ? 'subscribed' : `error ${res.status}`;
      } catch (e) {
        results.mailchimp = `error: ${(e as Error).message}`;
      }
    }

    // 3) HubSpot contact
    if (vc.hubspot_token && email) {
      try {
        const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${vc.hubspot_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              email,
              firstname: first_name || '',
              lastname: last_name || '',
              phone,
              message: payload.message || '',
            },
          }),
        });
        results.hubspot = res.ok ? 'created' : `error ${res.status}`;
      } catch (e) {
        results.hubspot = `error: ${(e as Error).message}`;
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

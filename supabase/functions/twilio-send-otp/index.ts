import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, channel } = await req.json();
    if (!phone || typeof phone !== 'string' || phone.length < 6 || phone.length > 20) {
      return new Response(JSON.stringify({ error: 'valid phone required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const verifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const twilioKey = Deno.env.get('TWILIO_API_KEY');
    if (!verifySid || !lovableKey || !twilioKey) {
      return new Response(JSON.stringify({ error: 'Twilio not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Twilio Verify is on a separate base path; gateway forwards `/Verify/...`
    const res = await fetch(`${GATEWAY_URL}/Verify/v2/Services/${verifySid}/Verifications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': twilioKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, Channel: channel === 'whatsapp' ? 'whatsapp' : 'sms' }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data?.message ?? 'twilio error', details: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ status: data.status, sid: data.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

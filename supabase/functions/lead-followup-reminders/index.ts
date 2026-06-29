import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Sends follow-up reminders to vCard owners when a lead's follow_up_at has passed.
// Designed to run on a 30-minute cron schedule.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const nowIso = new Date().toISOString();

  const { data: rows } = await supabase
    .from('vcard_leads')
    .select('id, visitor_name, visitor_email, visitor_phone, message, status, user_id, vcards(name)')
    .lte('follow_up_at', nowIso)
    .is('follow_up_sent_at', null)
    .limit(100);

  let sent = 0;
  for (const r of rows || []) {
    try {
      // get owner email
      const { data: prof } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', r.user_id)
        .maybeSingle();
      if (!prof?.email) continue;

      const vc: any = r.vcards;
      const html = `
        <h2>Follow-up reminder</h2>
        <p>হাই ${prof.full_name || ''},</p>
        <p>আপনি এই Lead-এর জন্য follow-up reminder সেট করেছিলেন:</p>
        <ul>
          <li><strong>Name:</strong> ${r.visitor_name || '-'}</li>
          <li><strong>Email:</strong> ${r.visitor_email || '-'}</li>
          <li><strong>Phone:</strong> ${r.visitor_phone || '-'}</li>
          <li><strong>Card:</strong> ${vc?.name || '-'}</li>
        </ul>
        <p><em>Message:</em> ${r.message || ''}</p>
        <p><a href="${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').split('.supabase.co')[0]}">Dashboard-এ Lead খুলুন</a></p>
      `;

      if (RESEND_API_KEY && LOVABLE_API_KEY) {
        await fetch('https://connector-gateway.lovable.dev/resend/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': RESEND_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Follow-up <onboarding@resend.dev>',
            to: [prof.email],
            subject: `⏰ Follow-up: ${r.visitor_name || 'Lead'}`,
            html,
          }),
        });
      }

      await supabase
        .from('vcard_leads')
        .update({ follow_up_sent_at: nowIso })
        .eq('id', r.id);

      // also create in-app notification
      await supabase.from('notifications').insert({
        user_id: r.user_id,
        title: 'Follow-up reminder',
        message: `${r.visitor_name || 'একটি lead'}-এর জন্য follow-up করার সময় হয়েছে`,
        type: 'lead',
        link: '/leads',
      });
      sent++;
    } catch (e) {
      console.error('follow-up failed', r.id, e);
    }
  }

  return new Response(JSON.stringify({ checked: rows?.length || 0, sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

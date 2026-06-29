import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Sends 24h-before reminder emails for upcoming appointments.
// Designed to be run on a 15-minute schedule.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const now = new Date();
  const windowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from('vcard_appointments')
    .select('id, vcard_id, visitor_name, visitor_email, appointment_date, appointment_time, notes, status, reminder_sent_at, vcards(name, meeting_link, email)')
    .gte('appointment_date', windowStart.split('T')[0])
    .lte('appointment_date', windowEnd.split('T')[0])
    .is('reminder_sent_at', null)
    .neq('status', 'cancelled')
    .limit(100);

  let sent = 0;
  let failed = 0;

  for (const r of rows || []) {
    const apptDt = new Date(`${r.appointment_date}T${r.appointment_time}`);
    const diffH = (apptDt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffH < 22 || diffH > 26) continue;

    const vc: any = r.vcards;
    const html = `
      <h2>Reminder: আপনার appointment ২৪ ঘণ্টার মধ্যে</h2>
      <p>প্রিয় ${r.visitor_name},</p>
      <p><strong>${vc?.name || 'আমাদের সাথে'}</strong> আপনার appointment আসছে:</p>
      <ul>
        <li><strong>Date:</strong> ${r.appointment_date}</li>
        <li><strong>Time:</strong> ${r.appointment_time}</li>
        ${vc?.meeting_link ? `<li><strong>Meeting Link:</strong> <a href="${vc.meeting_link}">${vc.meeting_link}</a></li>` : ''}
        ${r.notes ? `<li><strong>Notes:</strong> ${r.notes}</li>` : ''}
      </ul>
      <p>ধন্যবাদ!</p>
    `;

    try {
      if (RESEND_API_KEY && LOVABLE_API_KEY) {
        const res = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': RESEND_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Reminders <onboarding@resend.dev>',
            to: [r.visitor_email],
            subject: `Reminder: Appointment with ${vc?.name || 'us'} tomorrow`,
            html,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      await supabase
        .from('vcard_appointments')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', r.id);
      sent++;
    } catch (e) {
      console.error('reminder failed', r.id, e);
      failed++;
    }
  }

  return new Response(JSON.stringify({ checked: rows?.length || 0, sent, failed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

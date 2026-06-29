import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, BarChart, Mail, Video } from 'lucide-react';

interface Props { vcardId: string }

interface Settings {
  zapier_webhook_url: string;
  ga_measurement_id: string;
  meta_pixel_id: string;
  mailchimp_api_key: string;
  mailchimp_audience_id: string;
  hubspot_token: string;
  meeting_link: string;
}

const EMPTY: Settings = {
  zapier_webhook_url: '', ga_measurement_id: '', meta_pixel_id: '',
  mailchimp_api_key: '', mailchimp_audience_id: '', hubspot_token: '', meeting_link: '',
};

export default function IntegrationsPanel({ vcardId }: Props) {
  const { toast } = useToast();
  const [s, setS] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('vcards').select(
        'zapier_webhook_url, ga_measurement_id, meta_pixel_id, mailchimp_api_key, mailchimp_audience_id, hubspot_token, meeting_link'
      ).eq('id', vcardId).maybeSingle();
      if (data) {
        const d = data as any;
        setS({
          zapier_webhook_url: d.zapier_webhook_url || '',
          ga_measurement_id: d.ga_measurement_id || '',
          meta_pixel_id: d.meta_pixel_id || '',
          mailchimp_api_key: d.mailchimp_api_key || '',
          mailchimp_audience_id: d.mailchimp_audience_id || '',
          hubspot_token: d.hubspot_token || '',
          meeting_link: d.meeting_link || '',
        });
      }
      setLoading(false);
    })();
  }, [vcardId]);

  const save = async () => {
    setSaving(true);
    const payload: any = {};
    (Object.keys(s) as (keyof Settings)[]).forEach((k) => { payload[k] = s[k].trim() || null; });
    const { error } = await supabase.from('vcards').update(payload).eq('id', vcardId);
    setSaving(false);
    if (error) {
      toast({ title: 'সেভ ব্যর্থ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Integrations সেভ হয়েছে' });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart className="h-4 w-4" /> Analytics Pixels</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Google Analytics Measurement ID" value={s.ga_measurement_id} onChange={(v: string) => setS({ ...s, ga_measurement_id: v })} placeholder="G-XXXXXXXXXX" />
          <Field label="Meta Pixel ID" value={s.meta_pixel_id} onChange={(v: string) => setS({ ...s, meta_pixel_id: v })} placeholder="1234567890" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4" /> Zapier Webhook</CardTitle></CardHeader>
        <CardContent>
          <Field label="Webhook URL (নতুন lead/appointment-এ trigger হবে)" value={s.zapier_webhook_url}
            onChange={(v: string) => setS({ ...s, zapier_webhook_url: v })}
            placeholder="https://hooks.zapier.com/hooks/catch/..." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" /> Mailchimp & HubSpot</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label="Mailchimp API Key" value={s.mailchimp_api_key} type="password" onChange={(v: string) => setS({ ...s, mailchimp_api_key: v })} placeholder="xxxx-us21" />
          <Field label="Mailchimp Audience ID" value={s.mailchimp_audience_id} onChange={(v: string) => setS({ ...s, mailchimp_audience_id: v })} placeholder="abc123def4" />
          <Field label="HubSpot Private App Token" type="password" value={s.hubspot_token} onChange={(v: string) => setS({ ...s, hubspot_token: v })} placeholder="pat-na1-..." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Video className="h-4 w-4" /> Meeting Link</CardTitle></CardHeader>
        <CardContent>
          <Field label="Zoom / Google Meet URL (appointment reminders-এ যাবে)" value={s.meeting_link}
            onChange={(v: string) => setS({ ...s, meeting_link: v })}
            placeholder="https://meet.google.com/abc-defg-hij" />
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Integrations সেভ করুন
      </Button>
    </div>
  );
}

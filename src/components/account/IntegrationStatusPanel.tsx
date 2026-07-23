import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ExternalLink, Plug, Phone, Zap, BarChart3, Target, Mail } from 'lucide-react';

interface VCardIntegration {
  id: string;
  name: string;
  slug: string;
  zapier_webhook_url: string | null;
  ga_measurement_id: string | null;
  meta_pixel_id: string | null;
  mailchimp_api_key: string | null;
  hubspot_token: string | null;
  require_phone_verification: boolean;
}

const items = [
  { key: 'zapier_webhook_url', label: 'Zapier', icon: Zap },
  { key: 'ga_measurement_id', label: 'Google Analytics', icon: BarChart3 },
  { key: 'meta_pixel_id', label: 'Meta Pixel', icon: Target },
  { key: 'mailchimp_api_key', label: 'Mailchimp', icon: Mail },
  { key: 'hubspot_token', label: 'HubSpot', icon: Plug },
] as const;

export default function IntegrationStatusPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<VCardIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('vcards')
        .select('id, name, slug, zapier_webhook_url, google_analytics_id, meta_pixel_id, mailchimp_api_key, hubspot_token, require_phone_verification')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setCards((data as VCardIntegration[]) || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <div className="text-sm text-muted-foreground py-6">লোড হচ্ছে...</div>;
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Plug size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            ইন্টিগ্রেশন সেট করতে প্রথমে একটি vCard তৈরি করুন
          </p>
          <Button onClick={() => navigate('/vcard/new')}>নতুন vCard তৈরি</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug size={18} /> ইন্টিগ্রেশন ও ফোন ভেরিফিকেশন
          </CardTitle>
          <CardDescription>
            প্রতিটি vCard-এর ইন্টিগ্রেশন ও ফোন ভেরিফিকেশন স্ট্যাটাস। প্রয়োজনে কানেক্ট/রিকনেক্ট করুন।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cards.map((c) => (
            <div key={c.id} className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">/c/{c.slug}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/vcard/${c.id}?section=integrations`)}
                >
                  <ExternalLink size={12} className="mr-1" />
                  কনফিগার
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map(({ key, label, icon: Icon }) => {
                  const connected = Boolean((c as any)[key]);
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                        connected
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-muted/30 border-border text-muted-foreground'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="flex-1 truncate">{label}</span>
                      {connected ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : (
                        <XCircle size={14} className="text-muted-foreground/60" />
                      )}
                    </div>
                  );
                })}

                <div
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                    c.require_phone_verification
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-muted/30 border-border text-muted-foreground'
                  }`}
                >
                  <Phone size={14} />
                  <span className="flex-1 truncate">Phone OTP</span>
                  <Badge
                    variant={c.require_phone_verification ? 'default' : 'secondary'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {c.require_phone_verification ? 'চালু' : 'বন্ধ'}
                  </Badge>
                </div>
              </div>

              {/* Reconnect hint if any obviously stale */}
              {items.some(({ key }) => !((c as any)[key])) && (
                <div className="mt-3 text-xs text-muted-foreground">
                  ⚠️ কিছু ইন্টিগ্রেশন এখনো কানেক্ট নেই — vCard editor-এ গিয়ে সেট করুন।
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

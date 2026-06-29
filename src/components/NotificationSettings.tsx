import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Send, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  isPushSupported,
  pushPermission,
  getCurrentSubscription,
  subscribePush,
  unsubscribePush,
  sendTestPush,
} from '@/lib/webPush';

interface Prefs {
  push_new_lead: boolean;
  email_new_lead: boolean;
  weekly_digest: boolean;
}

const DEFAULT: Prefs = { push_new_lead: true, email_new_lead: true, weekly_digest: true };

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);
  const supported = isPushSupported();
  const permission = pushPermission();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('push_new_lead, email_new_lead, weekly_digest')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setPrefs(data);
      const sub = await getCurrentSubscription();
      setSubscribed(!!sub);
      setLoading(false);
    })();
  }, [user]);

  const update = async (patch: Partial<Prefs>) => {
    if (!user) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...next }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) toast({ title: 'সংরক্ষণ ব্যর্থ', variant: 'destructive' });
  };

  const handleSubscribe = async () => {
    setWorking(true);
    const r = await subscribePush();
    setWorking(false);
    if (r.ok) {
      setSubscribed(true);
      toast({ title: 'Push চালু হয়েছে ✅' });
    } else {
      toast({ title: 'চালু করা যায়নি', description: r.error, variant: 'destructive' });
    }
  };

  const handleUnsubscribe = async () => {
    setWorking(true);
    await unsubscribePush();
    setWorking(false);
    setSubscribed(false);
    toast({ title: 'Push বন্ধ হয়েছে' });
  };

  const handleTest = async () => {
    setWorking(true);
    const r = await sendTestPush();
    setWorking(false);
    if (r.ok) toast({ title: 'টেস্ট পাঠানো হয়েছে — notification check করুন' });
    else toast({ title: 'ব্যর্থ', description: r.error, variant: 'destructive' });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Browser push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell size={18} /> Browser Push Notifications</CardTitle>
          <CardDescription>
            ব্রাউজার বা ফোনের home-screen অ্যাপ থেকে instant notification পান।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!supported ? (
            <div className="text-sm text-amber-600 flex items-center gap-2"><XCircle size={16} /> এই ব্রাউজার Push support করে না।</div>
          ) : permission === 'denied' ? (
            <div className="text-sm text-destructive flex items-center gap-2">
              <BellOff size={16} /> Permission ব্লক করা — ব্রাউজার settings থেকে allow করুন।
            </div>
          ) : subscribed ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={16} /> চালু আছে</span>
              <Button size="sm" variant="outline" onClick={handleTest} disabled={working}>
                <Send size={14} className="mr-1" /> Test
              </Button>
              <Button size="sm" variant="ghost" onClick={handleUnsubscribe} disabled={working}>
                <BellOff size={14} className="mr-1" /> বন্ধ করুন
              </Button>
            </div>
          ) : (
            <Button onClick={handleSubscribe} disabled={working}>
              {working ? <Loader2 className="animate-spin mr-2" size={14} /> : <Bell size={14} className="mr-2" />}
              Push চালু করুন
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>কোন event এ notification পেতে চান?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">নতুন Lead → Push</Label>
              <p className="text-xs text-muted-foreground">কেউ contact form fill করলে browser push</p>
            </div>
            <Switch checked={prefs.push_new_lead} onCheckedChange={(v) => update({ push_new_lead: v })} disabled={saving} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">নতুন Lead → Email</Label>
              <p className="text-xs text-muted-foreground">প্রতিটি contact form submission এ ইমেইল</p>
            </div>
            <Switch checked={prefs.email_new_lead} onCheckedChange={(v) => update({ email_new_lead: v })} disabled={saving} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">সাপ্তাহিক ডাইজেস্ট</Label>
              <p className="text-xs text-muted-foreground">প্রতি সোমবার সকাল ৯টায় (BDT) পারফরম্যান্স রিপোর্ট</p>
            </div>
            <Switch checked={prefs.weekly_digest} onCheckedChange={(v) => update({ weekly_digest: v })} disabled={saving} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

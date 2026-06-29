import { useEffect, useState } from 'react';
import { Wrench, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function MaintenanceSettings() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [eta, setEta] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      if (data?.value) {
        const v = data.value as { enabled?: boolean; message?: string; eta?: string };
        setEnabled(!!v.enabled);
        setMessage(v.message || '');
        setEta(v.eta || '');
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const value = { enabled, message: message.trim(), eta: eta.trim() };
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'maintenance_mode', value }, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      toast({ title: 'সংরক্ষণ ব্যর্থ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: enabled ? 'রক্ষণাবেক্ষণ মোড চালু হয়েছে' : 'রক্ষণাবেক্ষণ মোড বন্ধ হয়েছে' });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <Wrench className="text-yellow-700 mt-0.5" size={20} />
        <div className="text-sm text-yellow-900">
          <p className="font-semibold">রক্ষণাবেক্ষণ মোড চালু হলে</p>
          <p className="mt-1">সাধারণ ব্যবহারকারী একটি maintenance পেজ দেখবেন। শুধু অ্যাডমিন ও /auth, /admin রুটগুলো খোলা থাকবে।</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div>
          <Label className="text-base">রক্ষণাবেক্ষণ মোড</Label>
          <p className="text-sm text-muted-foreground">সাইট সাময়িকভাবে বন্ধ রাখুন</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div>
        <Label htmlFor="msg">বার্তা</Label>
        <Textarea
          id="msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="আমরা এই মুহূর্তে কিছু আপডেট করছি..."
          rows={4}
          maxLength={500}
        />
      </div>

      <div>
        <Label htmlFor="eta">প্রত্যাশিত সময় (ঐচ্ছিক)</Label>
        <Input
          id="eta"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          placeholder="আনুমানিক ২ ঘণ্টা"
          maxLength={100}
        />
      </div>

      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
        সংরক্ষণ করুন
      </Button>
    </div>
  );
}

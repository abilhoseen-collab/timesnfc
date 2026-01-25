import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Smartphone, Building2 } from 'lucide-react';

interface PaymentSettings {
  bkash_number: string;
  nagad_number: string;
  rocket_number: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  bank_routing_number: string;
}

const defaultSettings: PaymentSettings = {
  bkash_number: '',
  nagad_number: '',
  rocket_number: '',
  bank_name: '',
  bank_account_name: '',
  bank_account_number: '',
  bank_branch: '',
  bank_routing_number: '',
};

export default function PaymentSettingsManager() {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'payment_settings')
      .maybeSingle();

    if (data && !error && typeof data.value === 'object' && data.value !== null) {
      const value = data.value as unknown as PaymentSettings;
      setSettings({ ...defaultSettings, ...value });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    // Check if settings already exist
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', 'payment_settings')
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('site_settings')
        .update({ value: settings as unknown as { [key: string]: string } })
        .eq('key', 'payment_settings'));
    } else {
      ({ error } = await supabase
        .from('site_settings')
        .insert([{ key: 'payment_settings', value: settings as unknown as { [key: string]: string } }]));
    }

    if (error) {
      toast({ title: 'সেভ করতে ব্যর্থ', variant: 'destructive' });
    } else {
      toast({ title: 'পেমেন্ট সেটিংস সেভ হয়েছে!' });
    }
    setSaving(false);
  };

  const handleChange = (field: keyof PaymentSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">পেমেন্ট সেটিংস</h2>
          <p className="text-sm text-muted-foreground">
            bKash, Nagad, Rocket এবং Bank details কনফিগার করুন
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
        </Button>
      </div>

      {/* Mobile Banking */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Smartphone size={20} className="text-primary" />
          মোবাইল ব্যাংকিং
        </h3>
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">b</span>
                bKash নম্বর
              </span>
            </label>
            <Input
              placeholder="01XXXXXXXXX"
              value={settings.bkash_number}
              onChange={(e) => handleChange('bkash_number', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">N</span>
                Nagad নম্বর
              </span>
            </label>
            <Input
              placeholder="01XXXXXXXXX"
              value={settings.nagad_number}
              onChange={(e) => handleChange('nagad_number', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">R</span>
                Rocket নম্বর
              </span>
            </label>
            <Input
              placeholder="01XXXXXXXXX"
              value={settings.rocket_number}
              onChange={(e) => handleChange('rocket_number', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bank Transfer */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-primary" />
          ব্যাংক ট্রান্সফার
        </h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ব্যাংকের নাম
            </label>
            <Input
              placeholder="যেমন: Dutch Bangla Bank Ltd."
              value={settings.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              অ্যাকাউন্ট হোল্ডারের নাম
            </label>
            <Input
              placeholder="যেমন: Times Digital"
              value={settings.bank_account_name}
              onChange={(e) => handleChange('bank_account_name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              অ্যাকাউন্ট নম্বর
            </label>
            <Input
              placeholder="যেমন: 1234567890123"
              value={settings.bank_account_number}
              onChange={(e) => handleChange('bank_account_number', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ব্রাঞ্চের নাম
            </label>
            <Input
              placeholder="যেমন: Dhanmondi Branch"
              value={settings.bank_branch}
              onChange={(e) => handleChange('bank_branch', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              রাউটিং নম্বর (ঐচ্ছিক)
            </label>
            <Input
              placeholder="যেমন: 110263525"
              value={settings.bank_routing_number}
              onChange={(e) => handleChange('bank_routing_number', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-muted/50 rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">প্রিভিউ</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">মোবাইল ব্যাংকিং</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-pink-500"></span>
                bKash: <strong>{settings.bkash_number || 'সেট করা হয়নি'}</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-orange-500"></span>
                Nagad: <strong>{settings.nagad_number || 'সেট করা হয়নি'}</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-600"></span>
                Rocket: <strong>{settings.rocket_number || 'সেট করা হয়নি'}</strong>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">ব্যাংক</h4>
            <ul className="space-y-1 text-sm">
              <li>ব্যাংক: <strong>{settings.bank_name || 'সেট করা হয়নি'}</strong></li>
              <li>অ্যাকাউন্ট: <strong>{settings.bank_account_name || 'সেট করা হয়নি'}</strong></li>
              <li>নম্বর: <strong>{settings.bank_account_number || 'সেট করা হয়নি'}</strong></li>
              <li>ব্রাঞ্চ: <strong>{settings.bank_branch || 'সেট করা হয়নি'}</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

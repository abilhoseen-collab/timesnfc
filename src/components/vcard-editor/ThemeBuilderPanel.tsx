import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette, Type, Sparkles } from 'lucide-react';

const FONTS = [
  { value: '', label: 'Default (Inter)' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Hind Siliguri', label: 'Hind Siliguri (বাংলা)' },
  { value: 'Tiro Bangla', label: 'Tiro Bangla' },
];

export default function ThemeBuilderPanel({ vcardId }: { vcardId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState({
    brand_color: '#7c3aed',
    accent_color: '#a78bfa',
    animated_background: false,
    custom_font: '',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('vcards').select(
        'brand_color, accent_color, animated_background, custom_font'
      ).eq('id', vcardId).maybeSingle();
      if (data) {
        const d = data as any;
        setS({
          brand_color: d.brand_color || '#7c3aed',
          accent_color: d.accent_color || '#a78bfa',
          animated_background: !!d.animated_background,
          custom_font: d.custom_font || '',
        });
      }
      setLoading(false);
    })();
  }, [vcardId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('vcards').update(s as any).eq('id', vcardId);
    setSaving(false);
    if (error) {
      toast({ title: 'সেভ ব্যর্থ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Theme সেভ হয়েছে' });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4" /> Brand Colors</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="w-32 text-sm">Primary</Label>
            <Input type="color" value={s.brand_color} onChange={(e) => setS({ ...s, brand_color: e.target.value })} className="w-16 h-10 p-1" />
            <Input value={s.brand_color} onChange={(e) => setS({ ...s, brand_color: e.target.value })} placeholder="#7c3aed" className="flex-1" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="w-32 text-sm">Accent</Label>
            <Input type="color" value={s.accent_color} onChange={(e) => setS({ ...s, accent_color: e.target.value })} className="w-16 h-10 p-1" />
            <Input value={s.accent_color} onChange={(e) => setS({ ...s, accent_color: e.target.value })} placeholder="#a78bfa" className="flex-1" />
          </div>
          <div
            className="h-16 rounded-lg"
            style={{ background: `linear-gradient(135deg, ${s.brand_color}, ${s.accent_color})` }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" /> Animated Background</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>চলমান গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড</Label>
              <p className="text-xs text-muted-foreground mt-1">কার্ডে চোখধাঁধানো অ্যানিমেটেড পটভূমি যোগ করে</p>
            </div>
            <Switch checked={s.animated_background} onCheckedChange={(v) => setS({ ...s, animated_background: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Type className="h-4 w-4" /> Custom Font</CardTitle></CardHeader>
        <CardContent>
          <select
            value={s.custom_font}
            onChange={(e) => setS({ ...s, custom_font: e.target.value })}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
          >
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Theme সেভ করুন
      </Button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { ArrowLeft, QrCode, Download, Loader2, CheckCircle2, FileArchive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface VCard {
  id: string;
  name: string;
  slug: string;
  job_title: string | null;
}

export default function BulkQR() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vcards, setVcards] = useState<VCard[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [size, setSize] = useState(512);
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  useEffect(() => {
    if (user) {
      supabase.from('vcards').select('id, name, slug, job_title')
        .eq('user_id', user.id).eq('is_active', true)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setVcards((data as VCard[]) || []); setLoading(false); });
    }
  }, [user]);

  const toggleAll = () => {
    if (selected.size === vcards.length) setSelected(new Set());
    else setSelected(new Set(vcards.map((v) => v.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const generateZip = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    try {
      const zip = new JSZip();
      const baseUrl = window.location.origin;
      for (const vc of vcards) {
        if (!selected.has(vc.id)) continue;
        const url = `${baseUrl}/c/${vc.slug}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: size,
          margin: 2,
          color: { dark: color, light: bgColor },
          errorCorrectionLevel: 'H',
        });
        const b64 = dataUrl.split(',')[1];
        const filename = `${vc.name.replace(/[^a-zA-Z0-9\-_]/g, '_')}_${vc.slug}.png`;
        zip.file(filename, b64, { base64: true });
      }
      // Add manifest CSV
      const csv = ['Name,Slug,URL']
        .concat(vcards.filter((v) => selected.has(v.id)).map((v) => `"${v.name}",${v.slug},${baseUrl}/c/${v.slug}`))
        .join('\n');
      zip.file('manifest.csv', csv);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vcard-qrcodes-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `${selected.size} টি QR ডাউনলোড হয়েছে!` });
    } catch (err) {
      toast({ title: 'জেনারেট ব্যর্থ', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const downloadOne = async (vc: VCard) => {
    const url = `${window.location.origin}/c/${vc.slug}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: size, margin: 2, color: { dark: color, light: bgColor }, errorCorrectionLevel: 'H',
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${vc.name.replace(/[^a-zA-Z0-9\-_]/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> ড্যাশবোর্ড
          </Link>
          <div className="flex items-center gap-2">
            <QrCode size={20} />
            <h1 className="text-lg font-semibold">Bulk QR Generator</h1>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Customization */}
        <div className="grid sm:grid-cols-3 gap-4 p-4 border rounded-xl bg-card">
          <div>
            <Label>সাইজ (px)</Label>
            <Input type="number" min={128} max={2048} step={64} value={size} onChange={(e) => setSize(+e.target.value)} />
          </div>
          <div>
            <Label>QR রঙ</Label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10" />
          </div>
          <div>
            <Label>ব্যাকগ্রাউন্ড</Label>
            <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10" />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Checkbox checked={selected.size === vcards.length && vcards.length > 0} onCheckedChange={toggleAll} id="all" />
            <label htmlFor="all" className="text-sm">
              {selected.size} / {vcards.length} নির্বাচিত
            </label>
          </div>
          <Button onClick={generateZip} disabled={selected.size === 0 || generating}>
            {generating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <FileArchive size={16} className="mr-2" />}
            ZIP ডাউনলোড ({selected.size})
          </Button>
        </div>

        {/* vCard list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : vcards.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <QrCode size={48} className="mx-auto mb-3 opacity-30" />
            <p>কোনো সক্রিয় vCard পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vcards.map((v) => (
              <div
                key={v.id}
                className={`border rounded-xl p-4 cursor-pointer transition ${selected.has(v.id) ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/40'}`}
                onClick={() => toggleOne(v.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{v.name}</div>
                    {v.job_title && <div className="text-xs text-muted-foreground truncate">{v.job_title}</div>}
                    <div className="text-xs text-muted-foreground mt-1 truncate">/c/{v.slug}</div>
                  </div>
                  {selected.has(v.id) ? (
                    <CheckCircle2 size={20} className="text-primary shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0" />
                  )}
                </div>
                <Button
                  size="sm" variant="ghost" className="w-full mt-2"
                  onClick={(e) => { e.stopPropagation(); downloadOne(v); }}
                >
                  <Download size={12} className="mr-1" /> এই QR
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

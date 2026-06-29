import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { ArrowLeft, Upload, Download, Loader2, CheckCircle2, XCircle, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Allowed CSV headers (case-insensitive)
const FIELDS = [
  'name', 'job_title', 'company', 'email', 'phone', 'website', 'address', 'bio',
  'linkedin_url', 'twitter_url', 'facebook_url', 'instagram_url', 'youtube_url',
  'github_url', 'whatsapp_number', 'telegram_username',
] as const;

type Field = typeof FIELDS[number];
type Row = Partial<Record<Field, string>> & { __row: number; __error?: string };

const SAMPLE_CSV = `name,job_title,company,email,phone,website,bio
"Rahim Uddin","Sales Manager","ABC Ltd","rahim@example.com","+8801711111111","https://example.com","Helping clients grow."
"Karim Hossain","Doctor","City Hospital","karim@example.com","+8801822222222","","MBBS, FCPS"
`;

const CHUNK_SIZE = 25;
const MAX_ROWS = 200;

function slugify(name: string, i: number) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'card';
  return `${base}-${Date.now().toString(36)}-${i}`;
}

export default function BulkCreate() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const limits = useSubscriptionLimits();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [parsing, setParsing] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState<{ row: number; name: string; error: string }[]>([]);

  const remaining = Math.max(0, (limits.vcardLimit || 0) - (limits.currentVcards || 0));
  const valid = rows.filter((r) => !r.__error);
  const willCreate = Math.min(valid.length, remaining);
  const overQuota = valid.length > remaining;

  useEffect(() => { setDone(0); setFailed([]); }, [rows]);

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-vcards-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (file: File) => {
    setParsing(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (res) => {
        const parsed: Row[] = res.data.slice(0, MAX_ROWS).map((raw, idx) => {
          const r: Row = { __row: idx + 2 };
          for (const f of FIELDS) {
            const v = (raw[f] || '').toString().trim();
            if (v) r[f] = v.slice(0, 1000);
          }
          if (!r.name) r.__error = 'name (নাম) আবশ্যক';
          else if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) r.__error = 'অবৈধ email';
          return r;
        });
        setRows(parsed);
        setParsing(false);
        if (res.data.length > MAX_ROWS) {
          toast({ title: `সর্বোচ্চ ${MAX_ROWS} সারি`, description: `প্রথম ${MAX_ROWS}টি দেখানো হলো।` });
        }
      },
      error: (err) => {
        setParsing(false);
        toast({ title: 'CSV পার্স ব্যর্থ', description: err.message, variant: 'destructive' });
      },
    });
  };

  const runImport = async () => {
    if (!user) return;
    if (willCreate === 0) return;

    setRunning(true);
    setDone(0);
    setFailed([]);

    const toCreate = valid.slice(0, willCreate);

    for (let i = 0; i < toCreate.length; i += CHUNK_SIZE) {
      const chunk = toCreate.slice(i, i + CHUNK_SIZE);
      const payload = chunk.map((r, j) => ({
        user_id: user.id,
        name: r.name!,
        job_title: r.job_title || null,
        company: r.company || null,
        email: r.email || null,
        phone: r.phone || null,
        website: r.website || null,
        address: r.address || null,
        bio: r.bio || null,
        linkedin_url: r.linkedin_url || null,
        twitter_url: r.twitter_url || null,
        facebook_url: r.facebook_url || null,
        instagram_url: r.instagram_url || null,
        youtube_url: r.youtube_url || null,
        github_url: r.github_url || null,
        whatsapp_number: r.whatsapp_number || null,
        telegram_username: r.telegram_username || null,
        slug: slugify(r.name!, i + j),
        template: 'freelancer',
        is_active: true,
      }));

      const { error } = await supabase.from('vcards').insert(payload);
      if (error) {
        setFailed((f) => [...f, ...chunk.map((r) => ({ row: r.__row, name: r.name || '', error: error.message }))]);
      } else {
        setDone((d) => d + chunk.length);
      }
      await new Promise((res) => setTimeout(res, 100));
    }

    setRunning(false);
    toast({ title: 'Bulk আমদানি সম্পন্ন', description: `${done} সফল, ${failed.length} ব্যর্থ` });
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">লগইন করুন</div>;

  const progress = valid.length > 0 ? (done / willCreate) * 100 : 0;
  const completed = done > 0 && !running;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> ড্যাশবোর্ড
          </Link>
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} />
            <h1 className="text-lg font-semibold">Bulk vCard তৈরি</h1>
          </div>
          <Button size="sm" variant="outline" onClick={downloadSample}>
            <Download size={14} className="mr-1" /> Sample CSV
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Quota */}
        <div className="rounded-xl border p-4 bg-card">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">আপনার প্যাকেজ quota</span>
            <span className="font-semibold">
              {limits.currentVcards} / {limits.vcardLimit} ব্যবহৃত
              {' • '}
              <span className="text-primary">{remaining} বাকি</span>
            </span>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-xl border-2 border-dashed p-8 text-center bg-card">
          <Upload size={36} className="mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-1">CSV ফাইল আপলোড করুন</h3>
          <p className="text-sm text-muted-foreground mb-4">
            সর্বোচ্চ {MAX_ROWS} সারি • প্রয়োজনীয় কলাম: <code className="bg-muted px-1 rounded">name</code>
          </p>
          <Input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={parsing || running}>
            {parsing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Upload size={16} className="mr-2" />}
            CSV নির্বাচন
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            সমর্থিত কলাম: {FIELDS.join(', ')}
          </p>
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm">
                মোট <strong>{rows.length}</strong> সারি •{' '}
                <span className="text-green-600">{valid.length} বৈধ</span>
                {rows.length - valid.length > 0 && (
                  <span className="text-destructive"> • {rows.length - valid.length} ত্রুটি</span>
                )}
              </div>
              {overQuota && (
                <div className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle size={14} /> Quota শেষ — শুধু প্রথম {willCreate}টি তৈরি হবে
                </div>
              )}
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 text-muted-foreground">{r.__row}</td>
                      <td className="p-2 font-medium">{r.name || '—'}</td>
                      <td className="p-2">{r.email || '—'}</td>
                      <td className="p-2">{r.phone || '—'}</td>
                      <td className="p-2">{r.company || '—'}</td>
                      <td className="p-2">
                        {r.__error ? (
                          <span className="text-destructive flex items-center gap-1"><XCircle size={12} />{r.__error}</span>
                        ) : i < willCreate ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12} />প্রস্তুত</span>
                        ) : (
                          <span className="text-muted-foreground">Quota অতিক্রম</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t space-y-3">
              {(running || done > 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>প্রগতি</span>
                    <span>{done} / {willCreate}</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {failed.length > 0 && (
                <div className="text-xs text-destructive bg-destructive/10 rounded p-2 max-h-24 overflow-auto">
                  <div className="font-semibold mb-1">{failed.length}টি ব্যর্থ:</div>
                  {failed.slice(0, 10).map((f, i) => (
                    <div key={i}>সারি {f.row} ({f.name}): {f.error}</div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRows([])} disabled={running}>
                  রিসেট
                </Button>
                {completed ? (
                  <Button onClick={() => navigate('/dashboard')}>
                    ড্যাশবোর্ডে যান
                  </Button>
                ) : (
                  <Button onClick={runImport} disabled={running || willCreate === 0 || !limits.hasActiveSubscription}>
                    {running ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    {willCreate} টি তৈরি করুন
                  </Button>
                )}
              </div>
              {!limits.hasActiveSubscription && (
                <p className="text-xs text-amber-600">⚠ সক্রিয় subscription প্রয়োজন।</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

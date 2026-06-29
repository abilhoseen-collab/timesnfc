import { useEffect, useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Factor { id: string; status: string; friendly_name?: string; factor_type: string; }

export default function TwoFactorAuth() {
  const { toast } = useToast();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      setFactors(data.totp as Factor[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadFactors(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `TOTP ${new Date().toLocaleDateString()}`,
    });
    setEnrolling(false);
    if (error || !data) {
      toast({ title: 'এনরোল ব্যর্থ', description: error?.message, variant: 'destructive' });
      return;
    }
    setEnrollData({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const verify = async () => {
    if (!enrollData) return;
    setVerifying(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.id });
    if (cErr || !challenge) {
      setVerifying(false);
      toast({ title: 'চ্যালেঞ্জ ব্যর্থ', description: cErr?.message, variant: 'destructive' });
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: enrollData.id,
      challengeId: challenge.id,
      code: otp.trim(),
    });
    setVerifying(false);
    if (vErr) {
      toast({ title: 'ভেরিফিকেশন ব্যর্থ', description: 'কোড ভুল। আবার চেষ্টা করুন।', variant: 'destructive' });
      return;
    }
    toast({ title: '2FA সফলভাবে চালু হয়েছে!' });
    setEnrollData(null);
    setOtp('');
    loadFactors();
  };

  const remove = async (factorId: string) => {
    if (!confirm('2FA বন্ধ করবেন? আপনার অ্যাকাউন্টের সুরক্ষা কমে যাবে।')) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast({ title: 'মুছতে ব্যর্থ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '2FA বন্ধ হয়েছে' });
    loadFactors();
  };

  const copySecret = async () => {
    if (!enrollData) return;
    await navigator.clipboard.writeText(enrollData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verified = factors.filter((f) => f.status === 'verified');

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={20} /> দুই-স্তরের নিরাপত্তা (2FA)
        </CardTitle>
        <CardDescription>
          Google Authenticator, Authy বা অনুরূপ অ্যাপ ব্যবহার করে আপনার অ্যাকাউন্ট আরও সুরক্ষিত করুন।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verified.length > 0 ? (
          <div className="space-y-2">
            {verified.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-green-600" size={20} />
                  <div>
                    <div className="font-medium text-sm">{f.friendly_name || 'TOTP'}</div>
                    <div className="text-xs text-muted-foreground">সক্রিয়</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => remove(f.id)}>
                  <ShieldOff size={14} className="mr-1" /> বন্ধ করুন
                </Button>
              </div>
            ))}
          </div>
        ) : enrollData ? (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="text-sm">
              <p className="font-medium mb-2">১. আপনার Authenticator অ্যাপে QR স্ক্যান করুন:</p>
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <img src={enrollData.qr} alt="2FA QR" className="w-48 h-48" />
              </div>
            </div>
            <div>
              <Label className="text-xs">অথবা সিক্রেট কী ম্যানুয়ালি দিন:</Label>
              <div className="flex gap-2 mt-1">
                <Input value={enrollData.secret} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copySecret}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="otp">২. অ্যাপ থেকে ৬-ডিজিট কোড দিন:</Label>
              <Input
                id="otp" value={otp} onChange={(e) => setOtp(e.target.value)}
                placeholder="123456" maxLength={6} className="font-mono text-lg text-center mt-1"
                inputMode="numeric"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={verify} disabled={verifying || otp.length !== 6} className="flex-1">
                {verifying && <Loader2 size={14} className="mr-2 animate-spin" />} যাচাই ও চালু করুন
              </Button>
              <Button variant="outline" onClick={() => { setEnrollData(null); setOtp(''); }}>বাতিল</Button>
            </div>
          </div>
        ) : (
          <Button onClick={startEnroll} disabled={enrolling}>
            {enrolling && <Loader2 size={14} className="mr-2 animate-spin" />}
            <Shield size={14} className="mr-2" /> 2FA চালু করুন
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Props {
  phone: string;
  verified: boolean;
  onVerified: () => void;
}

export default function PhoneOtpVerifier({ phone, verified, onVerified }: Props) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  if (verified) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <ShieldCheck size={16} /> ফোন ভেরিফাইড
      </div>
    );
  }

  const send = async () => {
    if (!phone) {
      toast({ title: 'ফোন নম্বর দিন', variant: 'destructive' });
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke('twilio-send-otp', { body: { phone } });
    setSending(false);
    if (error || (data as any)?.error) {
      toast({ title: 'OTP পাঠানো যায়নি', description: (data as any)?.error ?? error?.message, variant: 'destructive' });
      return;
    }
    setSent(true);
    toast({ title: 'OTP পাঠানো হয়েছে' });
  };

  const verify = async () => {
    if (code.length < 4) return;
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke('twilio-verify-otp', { body: { phone, code } });
    setVerifying(false);
    if (error || !(data as any)?.verified) {
      toast({ title: 'OTP সঠিক নয়', variant: 'destructive' });
      return;
    }
    toast({ title: 'ফোন ভেরিফাইড' });
    onVerified();
  };

  return (
    <div className="space-y-2 p-3 rounded-md border bg-muted/40">
      {!sent ? (
        <Button type="button" size="sm" variant="outline" onClick={send} disabled={sending || !phone}>
          {sending && <Loader2 className="animate-spin mr-2" size={14} />} OTP পাঠান
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
          />
          <Button type="button" size="sm" onClick={verify} disabled={verifying || code.length < 4}>
            {verifying ? <Loader2 className="animate-spin" size={14} /> : 'যাচাই'}
          </Button>
        </div>
      )}
    </div>
  );
}

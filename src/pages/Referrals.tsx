import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Share2, Users, Gift, Loader2 } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorHandler';

interface ReferralRow {
  id: string;
  referred_user_id: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_days: number;
  created_at: string;
}

export default function Referrals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refCode, setRefCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [profileRes, refRes] = await Promise.all([
        supabase.from('profiles').select('referral_code').eq('id', user.id).maybeSingle(),
        supabase
          .from('referrals')
          .select('id, referred_user_id, status, reward_days, created_at')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (profileRes.data?.referral_code) {
        setRefCode(profileRes.data.referral_code);
      } else {
        // backfill if somehow null
        const { data } = await supabase.rpc('generate_referral_code');
        if (data) {
          await supabase.from('profiles').update({ referral_code: data }).eq('id', user.id);
          setRefCode(data as string);
        }
      }

      if (refRes.error) {
        toast({ title: 'ত্রুটি', description: getUserFriendlyError(refRes.error), variant: 'destructive' });
      } else {
        setReferrals((refRes.data as ReferralRow[]) || []);
      }
      setLoading(false);
    })();
  }, [user, toast]);

  const referralLink = refCode
    ? `${window.location.origin}/auth?ref=${refCode}`
    : '';

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} কপি হয়েছে` });
  };

  const share = async () => {
    if (navigator.share && referralLink) {
      try {
        await navigator.share({
          title: 'Times Digital — আমার রেফারেল লিংক',
          text: 'এই লিংক দিয়ে সাইনআপ করুন এবং প্রিমিয়াম ফিচার ব্যবহার করুন!',
          url: referralLink,
        });
      } catch {/* user cancel */}
    } else {
      copy(referralLink, 'রেফারেল লিংক');
    }
  };

  const completed = referrals.filter((r) => r.status !== 'pending').length;
  const totalReward = referrals.reduce((s, r) => s + (r.reward_days || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container-custom flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">রেফারেল প্রোগ্রাম</h1>
        </div>
      </header>

      <main className="container-custom py-8 space-y-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Gift className="text-primary" size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1">বন্ধুদের রেফার করুন</h2>
                  <p className="text-sm text-muted-foreground">
                    আপনার রেফারেল কোড দিয়ে কেউ সাইনআপ করলে আপনি পাবেন বোনাস। আপনার বন্ধুরাও পাবে এক্সক্লুসিভ ডিসকাউন্ট।
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-5">
            <div className="text-3xl font-bold text-primary">{referrals.length}</div>
            <div className="text-sm text-muted-foreground mt-1">মোট রেফারেল</div>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <div className="text-3xl font-bold text-green-600">{completed}</div>
            <div className="text-sm text-muted-foreground mt-1">সফল রেফারেল</div>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <div className="text-3xl font-bold text-amber-500">{totalReward}</div>
            <div className="text-sm text-muted-foreground mt-1">মোট বোনাস (দিন)</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">আপনার রেফারেল কোড</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">কোড</label>
              <div className="flex gap-2">
                <Input value={refCode || ''} readOnly className="font-mono font-bold text-lg" />
                <Button variant="outline" onClick={() => refCode && copy(refCode, 'কোড')}>
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">শেয়ারযোগ্য লিংক</label>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="text-sm" />
                <Button variant="outline" onClick={() => copy(referralLink, 'লিংক')}>
                  <Copy size={16} />
                </Button>
                <Button onClick={share}>
                  <Share2 size={16} className="mr-2" /> শেয়ার
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users size={18} /> রেফারেল হিস্টোরি
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                এখনো কেউ আপনার কোড ব্যবহার করেনি।
              </p>
            ) : (
              <div className="space-y-2">
                {referrals.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        ইউজার ID: {r.referred_user_id.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('bn-BD')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.reward_days > 0 && (
                        <Badge variant="outline">+{r.reward_days} দিন</Badge>
                      )}
                      <Badge
                        variant={
                          r.status === 'rewarded' ? 'default'
                          : r.status === 'completed' ? 'secondary'
                          : 'outline'
                        }
                      >
                        {r.status === 'rewarded' ? 'বোনাস পেয়েছেন'
                         : r.status === 'completed' ? 'সম্পন্ন'
                         : 'অপেক্ষমাণ'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

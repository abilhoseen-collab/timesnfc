import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, DollarSign, Users, Award, Loader2 } from 'lucide-react';

const COMMISSION_BDT = 100; // per completed referral

export default function AffiliateDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, rewarded: 0 });
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [pRes, rRes, allRes] = await Promise.all([
        supabase.from('profiles').select('referral_code').eq('id', user.id).maybeSingle(),
        supabase.from('referrals').select('status').eq('referrer_id', user.id),
        supabase.from('referrals').select('referrer_id, status'),
      ]);
      setCode((pRes.data as any)?.referral_code || null);
      const rows = (rRes.data as any[]) || [];
      const s = { total: rows.length, completed: 0, pending: 0, rewarded: 0 };
      rows.forEach((r) => {
        if (r.status === 'completed') s.completed++;
        else if (r.status === 'rewarded') s.rewarded++;
        else s.pending++;
      });
      setStats(s);

      // compute rank
      const grouped = new Map<string, number>();
      ((allRes.data as any[]) || []).forEach((r) => {
        if (r.status === 'completed' || r.status === 'rewarded') {
          grouped.set(r.referrer_id, (grouped.get(r.referrer_id) || 0) + 1);
        }
      });
      const sorted = Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]);
      const idx = sorted.findIndex(([id]) => id === user.id);
      setRank(idx >= 0 ? idx + 1 : null);

      setLoading(false);
    })();
  }, [user]);

  const link = code ? `${window.location.origin}/auth?ref=${code}` : '';
  const earnings = (stats.completed + stats.rewarded) * COMMISSION_BDT;

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Affiliate Dashboard — Times NFC</title></Helmet>
      <div className="container max-w-4xl mx-auto p-4 sm:p-6">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-6">Affiliate Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card><CardContent className="p-4">
                <Users className="h-5 w-5 text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">মোট রেফার</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <Award className="h-5 w-5 text-green-500 mb-1" />
                <p className="text-2xl font-bold">{stats.completed + stats.rewarded}</p>
                <p className="text-xs text-muted-foreground">সফল</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <DollarSign className="h-5 w-5 text-yellow-500 mb-1" />
                <p className="text-2xl font-bold">৳{earnings}</p>
                <p className="text-xs text-muted-foreground">আয় (অনুমান)</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <Award className="h-5 w-5 text-purple-500 mb-1" />
                <p className="text-2xl font-bold">{rank ? `#${rank}` : '-'}</p>
                <p className="text-xs text-muted-foreground">Leaderboard rank</p>
              </CardContent></Card>
            </div>

            <Card className="mb-4">
              <CardHeader><CardTitle>আপনার Affiliate Link</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={link} readOnly />
                  <Button onClick={() => { navigator.clipboard.writeText(link); toast({ title: 'কপি হয়েছে' }); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  প্রতি সফল referral-এ ৳{COMMISSION_BDT} কমিশন। Approved হওয়ার পর আপনার ব্যালান্সে যোগ হবে।
                </p>
                <Button asChild variant="outline">
                  <Link to="/leaderboard">🏆 Leaderboard দেখুন</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

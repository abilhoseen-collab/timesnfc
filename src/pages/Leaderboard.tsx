import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, ArrowLeft, Loader2 } from 'lucide-react';

interface Row {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total: number;
  completed: number;
}

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: refs } = await supabase
        .from('referrals')
        .select('referrer_id, status');
      const grouped = new Map<string, { total: number; completed: number }>();
      (refs || []).forEach((r: any) => {
        const g = grouped.get(r.referrer_id) || { total: 0, completed: 0 };
        g.total++;
        if (r.status === 'completed' || r.status === 'rewarded') g.completed++;
        grouped.set(r.referrer_id, g);
      });
      const ids = Array.from(grouped.keys());
      if (ids.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ids);
      const merged: Row[] = ids
        .map((id) => {
          const p = (profiles || []).find((x: any) => x.id === id);
          const g = grouped.get(id)!;
          return {
            user_id: id,
            full_name: p?.full_name || 'Anonymous',
            avatar_url: p?.avatar_url || null,
            total: g.total,
            completed: g.completed,
          };
        })
        .sort((a, b) => b.completed - a.completed || b.total - a.total)
        .slice(0, 50);
      setRows(merged);
      setLoading(false);
    })();
  }, []);

  const medal = (i: number) => {
    if (i === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (i === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (i === 2) return <Medal className="h-5 w-5 text-orange-500" />;
    return <span className="text-muted-foreground font-mono">#{i + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Referral Leaderboard — Times NFC</title></Helmet>
      <div className="container max-w-3xl mx-auto p-4 sm:p-6">
        <Link to="/referrals" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Referrals
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Referral Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : rows.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">এখনো কোনো referral হয়নি</p>
            ) : (
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <div key={r.user_id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="w-10 flex justify-center">{medal(i)}</div>
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold">{r.full_name?.[0]}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">{r.total} মোট • {r.completed} সফল</p>
                    </div>
                    <Badge variant="secondary">{r.completed} ⭐</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

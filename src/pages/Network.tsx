import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, UserPlus, Users } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { toast } from 'sonner';

interface Saved {
  id: string;
  note: string | null;
  vcard: {
    id: string;
    slug: string | null;
    name: string;
    job_title: string | null;
    company: string | null;
    photo_url: string | null;
  } | null;
}

export default function Network() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('vcard_saved_contacts')
        .select('id, note, vcard:vcards(id, slug, name, job_title, company, photo_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      toast.error(getUserFriendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const remove = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('vcard_saved_contacts').delete().eq('id', id);
      if (error) throw error;
      toast.success('সরিয়ে ফেলা হয়েছে');
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (e) {
      toast.error(getUserFriendlyError(e));
    }
  };

  if (authLoading) {
    return <LoadingState variant="spinner" label="যাচাই করা হচ্ছে..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>আমার Network — Times NFC</title></Helmet>
      <div className="container max-w-4xl mx-auto p-4 sm:p-6">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> আমার Network</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingState variant="list" rows={4} />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<Users className="w-12 h-12" />}
                title="Network এখনো খালি"
                description={'অন্য vCard থেকে "Save Contact" বাটন ব্যবহার করে কার্ড save করুন।'}
                action={{ label: 'ডিরেক্টরি দেখুন', onClick: () => navigate('/directory') }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rows.map((s) =>
                  s.vcard ? (
                    <div key={s.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        {s.vcard.photo_url ? (
                          <img src={s.vcard.photo_url} loading="lazy" className="w-full h-full object-cover" alt={s.vcard.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold">{s.vcard.name?.[0]}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/c/${s.vcard.slug || s.vcard.id}`} className="font-medium truncate hover:underline block">
                          {s.vcard.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.vcard.job_title}{s.vcard.company ? ` @ ${s.vcard.company}` : ''}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)} aria-label="সরান">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

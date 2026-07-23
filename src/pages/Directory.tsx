import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, MapPin, Briefcase, Users } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { toast } from 'sonner';

interface DirCard {
  id: string;
  slug: string | null;
  name: string;
  job_title: string | null;
  company: string | null;
  photo_url: string | null;
  directory_category: string | null;
  address: string | null;
}

export default function Directory() {
  const [cards, setCards] = useState<DirCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [cat, setCat] = useState<string>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('vcards')
          .select('id, slug, name, job_title, company, photo_url, directory_category, address')
          .eq('listed_in_directory', true)
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        if (!cancelled) setCards((data as any) || []);
      } catch (e) {
        if (!cancelled) toast.error(getUserFriendlyError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(cards.map((c) => c.directory_category).filter(Boolean))) as string[],
    [cards]
  );

  const filtered = useMemo(
    () => cards.filter((c) => {
      const matchesQ =
        !debouncedQ ||
        c.name?.toLowerCase().includes(debouncedQ) ||
        c.company?.toLowerCase().includes(debouncedQ) ||
        c.job_title?.toLowerCase().includes(debouncedQ);
      const matchesCat = cat === 'all' || c.directory_category === cat;
      return matchesQ && matchesCat;
    }),
    [cards, debouncedQ, cat]
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Public Directory — Times NFC</title>
        <meta name="description" content="পাবলিক vCard ডিরেক্টরি — প্রফেশনালদের খুঁজে নিন" />
      </Helmet>
      <div className="container max-w-6xl mx-auto p-4 sm:p-6">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> হোম
        </Link>
        <h1 className="text-3xl font-bold mb-2">পাবলিক ডিরেক্টরি</h1>
        <p className="text-muted-foreground mb-6">আমাদের কমিউনিটির প্রফেশনালদের খুঁজে নিন</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="নাম, কোম্পানি, পদ..."
              className="pl-9"
              aria-label="ডিরেক্টরি অনুসন্ধান"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={cat === 'all' ? 'default' : 'outline'} onClick={() => setCat('all')}>
              সব
            </Button>
            {categories.map((c) => (
              <Button key={c} size="sm" variant={cat === c ? 'default' : 'outline'} onClick={() => setCat(c)}>
                {c}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingState variant="list" rows={6} label="ডিরেক্টরি লোড হচ্ছে..." />
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={<Users className="w-12 h-12" />}
                title="কোনো কার্ড পাওয়া যায়নি"
                description={debouncedQ || cat !== 'all'
                  ? 'ভিন্ন keyword বা category দিয়ে চেষ্টা করুন'
                  : 'এখনো কেউ পাবলিক ডিরেক্টরিতে তালিকাভুক্ত হননি'}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <Link key={c.id} to={`/c/${c.slug || c.id}`}>
                <Card className="hover:border-primary transition-colors h-full">
                  <CardContent className="p-4 flex gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{c.name}</h3>
                      {c.job_title && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {c.job_title}
                          {c.company ? ` @ ${c.company}` : ''}
                        </p>
                      )}
                      {c.address && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {c.address}
                        </p>
                      )}
                      {c.directory_category && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {c.directory_category}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

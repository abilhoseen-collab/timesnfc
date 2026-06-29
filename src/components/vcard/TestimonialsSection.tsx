import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Star, Plus, Loader2 } from 'lucide-react';

interface T {
  id: string;
  author_name: string;
  author_title: string | null;
  content: string;
  rating: number | null;
}

export default function TestimonialsSection({ vcardId }: { vcardId: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author_name: '', author_title: '', content: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any)
      .from('vcard_testimonials')
      .select('id, author_name, author_title, content, rating')
      .eq('vcard_id', vcardId)
      .eq('approved', true)
      .order('created_at', { ascending: false });
    setItems(data || []);
  };

  useEffect(() => { load(); }, [vcardId]);

  const submit = async () => {
    if (!form.author_name.trim() || !form.content.trim()) {
      toast({ title: 'নাম ও মন্তব্য আবশ্যক', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from('vcard_testimonials').insert({
      vcard_id: vcardId,
      author_name: form.author_name,
      author_title: form.author_title || null,
      content: form.content,
      rating: form.rating,
      approved: false,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'জমা দিতে ব্যর্থ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'ধন্যবাদ!', description: 'কার্ড মালিকের অনুমোদনের পর প্রদর্শিত হবে' });
    setForm({ author_name: '', author_title: '', content: '', rating: 5 });
    setOpen(false);
  };

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Testimonials</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> মন্তব্য দিন</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>আপনার অভিজ্ঞতা শেয়ার করুন</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="আপনার নাম *" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
              <Input placeholder="পদবি / কোম্পানি (optional)" value={form.author_title} onChange={(e) => setForm({ ...form, author_title: e.target.value })} />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
                    <Star className={`h-6 w-6 ${n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
              <Textarea placeholder="আপনার মন্তব্য *" value={form.content} rows={4} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              <Button onClick={submit} disabled={submitting} className="w-full">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} জমা দিন
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">এখনো কোনো testimonial নেই</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                {t.rating && (
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                )}
                <p className="text-sm mb-3">"{t.content}"</p>
                <p className="text-xs font-medium">{t.author_name}</p>
                {t.author_title && <p className="text-xs text-muted-foreground">{t.author_title}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function SaveContactButton({ vcardId }: { vcardId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('vcard_saved_contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('vcard_id', vcardId)
        .maybeSingle();
      setSaved(!!data);
    })();
  }, [user, vcardId]);

  const toggle = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSaving(true);
    if (saved) {
      await (supabase as any).from('vcard_saved_contacts').delete().eq('user_id', user.id).eq('vcard_id', vcardId);
      setSaved(false);
      toast({ title: 'Network থেকে সরানো হয়েছে' });
    } else {
      const { error } = await (supabase as any).from('vcard_saved_contacts').insert({ user_id: user.id, vcard_id: vcardId });
      if (!error) {
        setSaved(true);
        toast({ title: 'আপনার Network-এ যোগ হয়েছে' });
      }
    }
    setSaving(false);
  };

  return (
    <Button onClick={toggle} disabled={saving} variant={saved ? 'secondary' : 'outline'} size="sm">
      {saved ? <BookmarkCheck className="h-4 w-4 mr-1.5" /> : <Bookmark className="h-4 w-4 mr-1.5" />}
      {saved ? 'Saved' : 'Save Contact'}
    </Button>
  );
}

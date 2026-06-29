import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Globe, Mail, Phone, Linkedin, Twitter, Facebook, Instagram, Youtube, Github, MapPin } from 'lucide-react';

interface VC {
  id: string; name: string; bio: string | null; photo_url: string | null;
  website: string | null; email: string | null; phone: string | null; address: string | null;
  linkedin_url: string | null; twitter_url: string | null; facebook_url: string | null;
  instagram_url: string | null; youtube_url: string | null; github_url: string | null;
  whatsapp_number: string | null;
  linktree_enabled: boolean; hide_branding: boolean;
}

const LINKS = [
  { key: 'website', icon: Globe, label: 'Website', href: (v: VC) => v.website },
  { key: 'email', icon: Mail, label: 'Email', href: (v: VC) => v.email ? `mailto:${v.email}` : null },
  { key: 'phone', icon: Phone, label: 'Phone', href: (v: VC) => v.phone ? `tel:${v.phone}` : null },
  { key: 'whatsapp', icon: Phone, label: 'WhatsApp', href: (v: VC) => v.whatsapp_number ? `https://wa.me/${v.whatsapp_number.replace(/\D/g, '')}` : null },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', href: (v: VC) => v.linkedin_url },
  { key: 'twitter', icon: Twitter, label: 'Twitter', href: (v: VC) => v.twitter_url },
  { key: 'facebook', icon: Facebook, label: 'Facebook', href: (v: VC) => v.facebook_url },
  { key: 'instagram', icon: Instagram, label: 'Instagram', href: (v: VC) => v.instagram_url },
  { key: 'youtube', icon: Youtube, label: 'YouTube', href: (v: VC) => v.youtube_url },
  { key: 'github', icon: Github, label: 'GitHub', href: (v: VC) => v.github_url },
  { key: 'address', icon: MapPin, label: 'Address', href: (v: VC) => v.address ? `https://maps.google.com/?q=${encodeURIComponent(v.address)}` : null },
];

export default function LinktreeView() {
  const { slug } = useParams();
  const [vc, setVc] = useState<VC | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('vcards')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      setVc(data as any);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!vc) return <Navigate to="/" replace />;

  const links = LINKS.map((l) => ({ ...l, url: l.href(vc) })).filter((l) => l.url);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-blue-900 py-10 px-4">
      <Helmet>
        <title>{vc.name} — Links</title>
        <meta name="description" content={vc.bio || vc.name} />
      </Helmet>
      <div className="max-w-md mx-auto text-center">
        {vc.photo_url && (
          <img src={vc.photo_url} alt={vc.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-white/20" />
        )}
        <h1 className="text-2xl font-bold text-white mb-1">{vc.name}</h1>
        {vc.bio && <p className="text-white/70 text-sm mb-6">{vc.bio}</p>}

        <div className="space-y-3">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.key}
                href={l.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white rounded-xl px-5 py-3.5 transition-all hover:scale-[1.02]"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{l.label}</span>
              </a>
            );
          })}
        </div>

        {!vc.hide_branding && (
          <p className="text-white/40 text-xs mt-8">
            Powered by <a href="/" className="underline">Times NFC</a>
          </p>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Phone, 
  Globe,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Github,
  Download,
  Share2,
  User,
  FileText,
  Image,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VCard {
  id: string;
  name: string;
  job_title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  bio: string | null;
  template: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  github_url: string | null;
  photo_url: string | null;
  cover_image_url: string | null;
}

interface CustomSection {
  id: string;
  section_type: string;
  title: string | null;
  content: any;
  sort_order: number;
  is_visible: boolean;
}

const templateStyles: Record<string, { bg: string; accent: string; text: string }> = {
  freelancer: { bg: 'from-blue-600 to-indigo-700', accent: 'bg-blue-500', text: 'text-blue-600' },
  doctor: { bg: 'from-teal-500 to-cyan-600', accent: 'bg-teal-500', text: 'text-teal-600' },
  restaurant: { bg: 'from-orange-500 to-red-600', accent: 'bg-orange-500', text: 'text-orange-600' },
  realestate: { bg: 'from-emerald-500 to-green-600', accent: 'bg-emerald-500', text: 'text-emerald-600' },
  fitness: { bg: 'from-purple-600 to-pink-600', accent: 'bg-purple-500', text: 'text-purple-600' },
  photography: { bg: 'from-gray-800 to-gray-900', accent: 'bg-gray-700', text: 'text-gray-700' },
  lawfirm: { bg: 'from-slate-700 to-slate-900', accent: 'bg-slate-600', text: 'text-slate-700' },
  cafe: { bg: 'from-amber-600 to-yellow-700', accent: 'bg-amber-500', text: 'text-amber-600' },
  salon: { bg: 'from-pink-500 to-rose-600', accent: 'bg-pink-500', text: 'text-pink-600' },
  construction: { bg: 'from-yellow-600 to-orange-700', accent: 'bg-yellow-500', text: 'text-yellow-600' },
  eventplanner: { bg: 'from-violet-600 to-purple-700', accent: 'bg-violet-500', text: 'text-violet-600' },
  'tech-startup': { bg: 'from-cyan-500 to-blue-600', accent: 'bg-cyan-500', text: 'text-cyan-600' },
};

export default function VCardPublic() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [vcard, setVcard] = useState<VCard | null>(null);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchVCard();
      trackView();
    }
  }, [slug]);

  const fetchVCard = async () => {
    const { data, error } = await supabase
      .from('vcards')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else {
      setVcard(data);
      // Fetch custom sections
      const { data: sectionsData } = await supabase
        .from('vcard_custom_sections')
        .select('*')
        .eq('vcard_id', data.id)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });
      
      if (sectionsData) {
        setCustomSections(sectionsData);
      }
    }
    setLoading(false);
  };

  const trackView = async () => {
    // Get vcard id first
    const { data } = await supabase
      .from('vcards')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (data) {
      await supabase.from('vcard_analytics').insert({
        vcard_id: data.id,
        event_type: 'view',
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      });

      // Send notification (fire and forget)
      sendNotification(data.id, 'view');
    }
  };

  const sendNotification = async (vcardId: string, eventType: 'view' | 'link_click', linkName?: string) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: { vcard_id: vcardId, event_type: eventType, link_name: linkName },
      });
    } catch (error) {
      console.log('Notification skipped:', error);
    }
  };

  const trackLinkClick = async (linkName: string) => {
    if (vcard) {
      await supabase.from('vcard_analytics').insert({
        vcard_id: vcard.id,
        event_type: 'link_click',
        link_name: linkName,
        user_agent: navigator.userAgent,
      });

      // Send notification (fire and forget)
      sendNotification(vcard.id, 'link_click', linkName);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: vcard?.name,
        text: `Check out ${vcard?.name}'s digital business card`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  const downloadVCard = () => {
    if (!vcard) return;

    const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:${vcard.name}
${vcard.job_title ? `TITLE:${vcard.job_title}` : ''}
${vcard.company ? `ORG:${vcard.company}` : ''}
${vcard.email ? `EMAIL:${vcard.email}` : ''}
${vcard.phone ? `TEL:${vcard.phone}` : ''}
${vcard.website ? `URL:${vcard.website}` : ''}
${vcard.address ? `ADR:;;${vcard.address}` : ''}
END:VCARD`;

    const blob = new Blob([vcardData], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vcard.name.replace(/\s+/g, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    trackLinkClick('download_vcard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound || !vcard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <User size={64} className="text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Card Not Found</h1>
        <p className="text-muted-foreground text-center">
          This digital business card doesn't exist or has been deactivated.
        </p>
      </div>
    );
  }

  const style = templateStyles[vcard.template || 'freelancer'] || templateStyles.freelancer;

  const socialLinks = [
    { url: vcard.linkedin_url, icon: Linkedin, name: 'LinkedIn' },
    { url: vcard.twitter_url, icon: Twitter, name: 'Twitter' },
    { url: vcard.facebook_url, icon: Facebook, name: 'Facebook' },
    { url: vcard.instagram_url, icon: Instagram, name: 'Instagram' },
    { url: vcard.youtube_url, icon: Youtube, name: 'YouTube' },
    { url: vcard.github_url, icon: Github, name: 'GitHub' },
  ].filter(link => link.url);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Header with gradient or cover image */}
        <div 
          className={`${vcard.cover_image_url ? '' : `bg-gradient-to-br ${style.bg}`} pt-12 pb-20 px-6 text-white relative`}
          style={vcard.cover_image_url ? {
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${vcard.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/20"
              onClick={handleShare}
            >
              <Share2 size={20} />
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl mx-4 -mt-16 relative z-10 overflow-hidden">
          {/* Avatar */}
          <div className="flex justify-center -mt-0">
            <div className={`w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br ${style.bg} flex items-center justify-center -mt-14`}>
              {vcard.photo_url ? (
                <img 
                  src={vcard.photo_url} 
                  alt={vcard.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {vcard.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div className="text-center px-6 pt-4 pb-6">
            <h1 className="text-2xl font-bold text-gray-900">{vcard.name}</h1>
            {vcard.job_title && (
              <p className={`${style.text} font-medium mt-1`}>{vcard.job_title}</p>
            )}
            {vcard.company && (
              <p className="text-gray-500 text-sm mt-1">{vcard.company}</p>
            )}
            {vcard.bio && (
              <p className="text-gray-600 text-sm mt-4 leading-relaxed">{vcard.bio}</p>
            )}
          </div>

          {/* Contact Info */}
          <div className="px-6 pb-6 space-y-3">
            {vcard.email && (
              <a
                href={`mailto:${vcard.email}`}
                onClick={() => trackLinkClick('email')}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full ${style.accent} flex items-center justify-center`}>
                  <Mail size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{vcard.email}</p>
                </div>
              </a>
            )}

            {vcard.phone && (
              <a
                href={`tel:${vcard.phone}`}
                onClick={() => trackLinkClick('phone')}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full ${style.accent} flex items-center justify-center`}>
                  <Phone size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{vcard.phone}</p>
                </div>
              </a>
            )}

            {vcard.website && (
              <a
                href={vcard.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick('website')}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full ${style.accent} flex items-center justify-center`}>
                  <Globe size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Website</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{vcard.website}</p>
                </div>
              </a>
            )}

            {vcard.address && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 rounded-full ${style.accent} flex items-center justify-center`}>
                  <MapPin size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">{vcard.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="px-6 pb-6">
              <div className="flex justify-center gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackLinkClick(link.name.toLowerCase())}
                    className={`w-12 h-12 rounded-full ${style.accent} flex items-center justify-center hover:opacity-90 transition-opacity`}
                  >
                    <link.icon size={22} className="text-white" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Custom Sections */}
          {customSections.length > 0 && (
            <div className="px-6 pb-6 space-y-6">
              {customSections.map((section) => (
                <div key={section.id} className="border-t border-gray-100 pt-6">
                  {section.title && (
                    <h3 className={`text-lg font-bold ${style.text} mb-4 flex items-center gap-2`}>
                      {section.section_type === 'text' && <FileText size={18} />}
                      {section.section_type === 'gallery' && <Image size={18} />}
                      {section.section_type === 'products' && <ShoppingBag size={18} />}
                      {section.title}
                    </h3>
                  )}
                  
                  {/* Text Section */}
                  {section.section_type === 'text' && (section.content?.body || section.content?.heading) && (
                    <div>
                      {section.content.heading && (
                        <h4 className="font-semibold text-gray-900 mb-2">{section.content.heading}</h4>
                      )}
                      {section.content.body && (
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                          {section.content.body}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Image Gallery Section */}
                  {section.section_type === 'image_gallery' && section.content?.images && section.content.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {(section.content.images as string[]).map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <img 
                            src={img} 
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Service Cards Section */}
                  {section.section_type === 'service_card' && section.content?.services && (
                    <div className="space-y-3">
                      {(section.content.services as { name: string; price: string; description?: string }[]).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className={`w-10 h-10 rounded-lg ${style.accent} flex items-center justify-center flex-shrink-0`}>
                            <ShoppingBag size={16} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              {item.price && (
                                <span className={`${style.text} font-bold text-sm`}>{item.price}</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Download Button */}
          <div className="px-6 pb-6">
            <Button
              onClick={downloadVCard}
              className={`w-full bg-gradient-to-r ${style.bg} hover:opacity-90 text-white font-semibold py-6`}
            >
              <Download size={18} className="mr-2" />
              Save Contact
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>Powered by Digital Business Card</p>
        </div>
      </motion.div>
    </div>
  );
}
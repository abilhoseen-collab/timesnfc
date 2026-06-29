import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import ShareDialog from '@/components/vcard/ShareDialog';
import VCardPixelScripts from '@/components/vcard/VCardPixelScripts';
import VCardThemeInjector from '@/components/vcard/VCardThemeInjector';
import { readUTM, attachScrollTracking } from '@/lib/utmAndScroll';
import TestimonialsSection from '@/components/vcard/TestimonialsSection';
import SaveContactButton from '@/components/vcard/SaveContactButton';
import VCardChatWidget from '@/components/vcard/VCardChatWidget';
import BookingSlotPicker from '@/components/vcard/BookingSlotPicker';
import PhoneOtpVerifier from '@/components/vcard/PhoneOtpVerifier';
import { trackConversion, getVariant } from '@/lib/abTesting';
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
  ShoppingBag,
  Video,
  MessageCircle,
  Send,
  Wallet,
  X,
  Copy,
  Check,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import GalleryCarousel from '@/components/vcard/GalleryCarousel';
import ServiceCatalog from '@/components/vcard/ServiceCatalog';
import ProductCatalog from '@/components/vcard/ProductCatalog';
import ProductGallery from '@/components/vcard/ProductGallery';
import SocialProofBadges from '@/components/vcard/SocialProofBadges';
import FAQSection from '@/components/vcard/FAQSection';
import ContactForm from '@/components/vcard/ContactForm';
import AddToCalendarButton from '@/components/vcard/AddToCalendarButton';

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
  // Chat & Payment fields
  whatsapp_number: string | null;
  telegram_username: string | null;
  chat_enabled: boolean;
  payment_enabled: boolean;
  payment_bkash: string | null;
  payment_nagad: string | null;
  payment_rocket: string | null;
  payment_bank_details: string | null;
  payment_button_text: string | null;
  // Appointment fields
  appointment_enabled: boolean;
  appointment_title: string | null;
  appointment_description: string | null;
  appointment_duration_minutes: number;
  appointment_available_days: string[];
  appointment_start_time: string | null;
  appointment_end_time: string | null;
  appointment_email: string | null;
  require_phone_verification?: boolean | null;
  owner_whatsapp_number?: string | null;
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedPayment, setCopiedPayment] = useState<string | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    notes: ''
  });
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);

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
      // Parse appointment_available_days from JSON
      const parsedData: VCard = {
        ...data,
        appointment_available_days: Array.isArray(data.appointment_available_days)
          ? (data.appointment_available_days as string[])
          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      };
      setVcard(parsedData);
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
      // Generate visitor/session IDs
      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('visitor_id', visitorId);
      }
      
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session_id', sessionId);
      }
      
      const visitedKey = `visited_vcard_${data.id}`;
      const isUnique = !sessionStorage.getItem(visitedKey);
      if (isUnique) {
        sessionStorage.setItem(visitedKey, 'true');
      }

      const utm = readUTM();
      await supabase.from('vcard_analytics').insert({
        vcard_id: data.id,
        event_type: 'view',
        visitor_id: visitorId,
        session_id: sessionId,
        is_unique: isUnique,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        ...utm,
      } as any);

      // Track scroll milestones
      attachScrollTracking((pct) => {
        supabase.from('vcard_analytics').insert({
          vcard_id: data.id,
          event_type: 'scroll',
          visitor_id: visitorId,
          session_id: sessionId,
          scroll_depth: pct,
        } as any);
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

  // Helper function to render video embeds
  const renderVideoEmbed = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    if (youtubeMatch) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      );
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
    if (vimeoMatch) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Vimeo video"
        />
      );
    }
    
    // Direct video link
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <video controls className="w-full h-full">
          <source src={url} />
          Your browser does not support the video tag.
        </video>
      );
    }
    
    return null;
  };

  const handleShare = () => {
    setShareOpen(true);
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

  // Generate Google Maps embed URL
  const getGoogleMapsEmbedUrl = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  };

  // Handle appointment booking
  const handleBookAppointment = async () => {
    if (!appointmentForm.name || !appointmentForm.email || !appointmentForm.date || !appointmentForm.time) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    if (vcard.require_phone_verification && !phoneVerified) {
      toast({ title: 'ফোন ভেরিফিকেশন প্রয়োজন', variant: 'destructive' });
      return;
    }

    setBookingAppointment(true);
    try {
      const { data: appointmentData, error } = await supabase.from('vcard_appointments').insert({
        vcard_id: vcard.id,
        visitor_name: appointmentForm.name,
        visitor_email: appointmentForm.email,
        visitor_phone: appointmentForm.phone || null,
        appointment_date: appointmentForm.date,
        appointment_time: appointmentForm.time,
        notes: appointmentForm.notes || null,
        phone_verified: phoneVerified,
      } as any).select().single();

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-appointment-notification', {
          body: {
            vcard_id: vcard.id,
            appointment_id: appointmentData.id,
            visitor_name: appointmentForm.name,
            visitor_email: appointmentForm.email,
            visitor_phone: appointmentForm.phone,
            appointment_date: appointmentForm.date,
            appointment_time: appointmentForm.time,
            notes: appointmentForm.notes,
          },
        });
      } catch (notifError) {
        console.log('Notification skipped:', notifError);
      }

      // Fan out to integrations
      supabase.functions.invoke('dispatch-integrations', {
        body: {
          vcard_id: vcard.id,
          type: 'appointment',
          payload: {
            visitor_name: appointmentForm.name,
            visitor_email: appointmentForm.email,
            visitor_phone: appointmentForm.phone,
            appointment_date: appointmentForm.date,
            appointment_time: appointmentForm.time,
            notes: appointmentForm.notes,
          },
        },
      }).catch(() => {});

      toast({ title: 'Appointment booked successfully!' });
      trackConversion('booking_cta', { vcardId: vcard.id });

      // Optional WhatsApp confirmation deep-link (visitor → owner)
      const ownerWa = vcard.owner_whatsapp_number || (vcard as any).whatsapp_number;
      if (ownerWa) {
        const wa = ownerWa.replace(/[^\d]/g, '');
        const msg = encodeURIComponent(
          `আসসালামু আলাইকুম, আমি ${appointmentForm.name}. ${appointmentForm.date} ${appointmentForm.time}-এ একটি appointment book করেছি।`
        );
        window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
      }

      setShowAppointmentModal(false);
      setAppointmentForm({ name: '', email: '', phone: '', date: '', time: '', notes: '' });
      setPhoneVerified(false);
      trackLinkClick('appointment_booked');
    } catch (error: any) {
      toast({ title: 'Failed to book appointment', variant: 'destructive' });
    } finally {
      setBookingAppointment(false);
    }
  };

  // Generate available time slots — respects start/end minutes too
  const getTimeSlots = () => {
    if (!vcard.appointment_start_time || !vcard.appointment_end_time) return [];
    const slots: string[] = [];
    const [startHour, startMin = 0] = vcard.appointment_start_time.split(':').map(Number);
    const [endHour, endMin = 0] = vcard.appointment_end_time.split(':').map(Number);
    const duration = Math.max(5, vcard.appointment_duration_minutes || 30);
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    for (let m = startTotal; m + duration <= endTotal; m += duration) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`);
    }
    return slots;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const ogImageUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vcard-og-image?slug=${slug}`;
  const pageTitle = `${vcard.name}${vcard.job_title ? ` — ${vcard.job_title}` : ''}`;
  const pageDesc = vcard.bio || `${vcard.name}-এর ডিজিটাল বিজনেস কার্ড। তাৎক্ষণিক যোগাযোগ করুন।`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={shareUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>
      <VCardPixelScripts gaId={(vcard as any).ga_measurement_id} pixelId={(vcard as any).meta_pixel_id} />
      <VCardThemeInjector
        brandColor={(vcard as any).brand_color}
        accentColor={(vcard as any).accent_color}
        animated={(vcard as any).animated_background}
        customFont={(vcard as any).custom_font}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto pb-8"
      >
        {/* Cover Image - Separate from profile */}
        <div 
          className={`${vcard.cover_image_url ? '' : `bg-gradient-to-br ${style.bg}`} h-44 md:h-52 relative rounded-b-3xl overflow-hidden`}
          style={vcard.cover_image_url ? {
            backgroundImage: `url(${vcard.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
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

        {/* Profile Card - Positioned below cover with avatar overlap */}
        <div className="bg-white rounded-3xl shadow-xl mx-4 -mt-16 relative z-10 overflow-visible">
          {/* Avatar - Overlapping cover and card */}
          <div className="flex justify-center">
            <div className={`w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br ${style.bg} flex items-center justify-center -mt-16`}>
              {vcard.photo_url ? (
                <img 
                  src={vcard.photo_url} 
                  alt={vcard.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-white">
                  {vcard.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Name & Title - Clear spacing below avatar */}
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

          {/* Google Maps - Show if address exists */}
          {vcard.address && (
            <div className="px-6 pb-6">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  src={getGoogleMapsEmbedUrl(vcard.address)}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                  className="w-full"
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vcard.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick('google_maps')}
                className={`flex items-center justify-center gap-2 mt-3 text-sm ${style.text} hover:underline`}
              >
                <MapPin size={14} />
                Open in Google Maps
              </a>
            </div>
          )}

          {/* Appointment Booking Button */}
          {vcard.appointment_enabled && (() => {
            const ctaVariant = getVariant('booking_cta', ['default', 'urgent'] as const, { vcardId: vcard.id });
            const ctaLabel =
              ctaVariant === 'urgent'
                ? `⚡ এখনই বুক করুন — ${vcard.appointment_duration_minutes || 30} মিনিট`
                : (vcard.appointment_title || 'Book an Appointment');
            return (
              <div className="px-6 pb-4">
                <Button
                  onClick={() => {
                    setShowAppointmentModal(true);
                    trackLinkClick('appointment_button');
                  }}
                  className={`w-full bg-gradient-to-r ${style.bg} hover:opacity-90 text-white font-semibold py-6`}
                >
                  <Calendar size={18} className="mr-2" />
                  {ctaLabel}
                </Button>
                {vcard.appointment_description && (
                  <p className="text-xs text-center text-gray-500 mt-2">{vcard.appointment_description}</p>
                )}
              </div>
            );
          })()}

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
                      {section.section_type === 'image_gallery' && <Image size={18} />}
                      {section.section_type === 'products' && <ShoppingBag size={18} />}
                      {section.section_type === 'service_card' && <ShoppingBag size={18} />}
                      {section.section_type === 'video' && <Video size={18} />}
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

                  {/* Image Gallery Section - with Carousel */}
                  {section.section_type === 'image_gallery' && section.content?.images && section.content.images.length > 0 && (
                    <GalleryCarousel 
                      images={section.content.images as string[]} 
                      title={section.title || 'Gallery'} 
                    />
                  )}

                  {/* Service Cards Section - with Cart & Checkout functionality */}
                  {section.section_type === 'service_card' && section.content?.services && (
                    <ServiceCatalog
                      services={section.content.services as { name: string; price: string; description?: string; image?: string; category?: string }[]}
                      accentColor={style.accent}
                      ownerName={vcard.name}
                      ownerPhone={vcard.phone}
                      ownerEmail={vcard.email}
                      whatsappNumber={vcard.whatsapp_number}
                      bkashNumber={vcard.payment_bkash}
                      nagadNumber={vcard.payment_nagad}
                      rocketNumber={vcard.payment_rocket}
                      bankDetails={vcard.payment_bank_details}
                      onTrackClick={trackLinkClick}
                    />
                  )}

                  {/* Video Section */}
                  {section.section_type === 'video' && section.content?.video_url && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                      {renderVideoEmbed(section.content.video_url)}
                    </div>
                  )}

                  {/* Testimonials Section */}
                  {section.section_type === 'testimonial' && section.content?.testimonials && (
                    <div className="space-y-4">
                      {(section.content.testimonials as { name: string; role?: string; company?: string; content: string; rating?: number; avatar?: string }[]).map((testimonial, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative">
                          {testimonial.rating && (
                            <div className="flex items-center gap-0.5 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={star <= testimonial.rating! ? '#facc15' : '#e5e7eb'} className="w-4 h-4">
                                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                              ))}
                            </div>
                          )}
                          <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{testimonial.content}"</p>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${testimonial.avatar ? '' : `${style.accent}`}`}>
                              {testimonial.avatar ? (
                                <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-bold text-sm">{testimonial.name?.charAt(0)?.toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                              {(testimonial.role || testimonial.company) && (
                                <p className="text-xs text-gray-500">{testimonial.role}{testimonial.role && testimonial.company && ', '}{testimonial.company}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Product Catalog Section */}
                  {section.section_type === 'product_catalog' && section.content?.products && (
                    <ProductCatalog
                      products={section.content.products}
                      accentColor={style.accent}
                      ownerName={vcard.name}
                      ownerPhone={vcard.phone}
                      ownerEmail={vcard.email}
                      bkashNumber={vcard.payment_bkash}
                      nagadNumber={vcard.payment_nagad}
                      rocketNumber={vcard.payment_rocket}
                      bankDetails={vcard.payment_bank_details}
                      onTrackClick={trackLinkClick}
                    />
                  )}

                  {/* Social Proof Badges */}
                  {section.section_type === 'social_proof' && section.content?.badges && (
                    <SocialProofBadges badges={section.content.badges} accentColor={style.accent} />
                  )}

                  {/* FAQ Section */}
                  {section.section_type === 'faq' && section.content?.faqs && (
                    <FAQSection faqs={section.content.faqs} accentColor={style.accent} />
                  )}

                  {/* Product Gallery Section */}
                  {section.section_type === 'product_gallery' && section.content?.products && (
                    <ProductGallery
                      products={section.content.products.map((p: any) => ({
                        name: p.name,
                        price: p.price,
                        description: p.description,
                        image: p.image,
                      }))}
                      accentColor={style.accent}
                      onTrackClick={trackLinkClick}
                    />
                  )}

                  {/* Contact Form Section */}
                  {section.section_type === 'contact_form' && (
                    <ContactForm
                      vcardId={vcard.id}
                      ownerName={vcard.name}
                      ownerEmail={vcard.email}
                      accentColor={style.accent}
                      formTitle={section.content?.form_title}
                      formDescription={section.content?.form_description}
                      onSubmit={() => trackLinkClick('contact_form_submit')}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Payment/Donation Button */}
          {vcard.payment_enabled && (vcard.payment_bkash || vcard.payment_nagad || vcard.payment_rocket || vcard.payment_bank_details) && (
            <div className="px-6 pb-4">
              <Button
                onClick={() => {
                  setShowPaymentModal(true);
                  trackLinkClick('payment_button');
                }}
                variant="outline"
                className={`w-full border-2 ${style.text} font-semibold py-6 hover:bg-gray-50`}
              >
                <Wallet size={18} className="mr-2" />
                {vcard.payment_button_text || 'Send Payment / Donate'}
              </Button>
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

        {/* Live Chat Widget - Floating Buttons */}
        {vcard.chat_enabled && (vcard.whatsapp_number || vcard.telegram_username) && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {vcard.whatsapp_number && (
              <motion.a
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                href={`https://wa.me/${vcard.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick('whatsapp_chat')}
                className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
                title="Chat on WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </motion.a>
            )}
            {vcard.telegram_username && (
              <motion.a
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                href={`https://t.me/${vcard.telegram_username.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick('telegram_chat')}
                className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
                title="Chat on Telegram"
              >
                <Send size={24} className="text-white" />
              </motion.a>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className={`bg-gradient-to-r ${style.bg} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Payment Methods</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/20"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                <p className="text-white/80 text-sm mt-1">Send payment to {vcard.name}</p>
              </div>
              
              <div className="p-6 space-y-4">
                {vcard.payment_bkash && (
                  <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl border border-pink-200">
                    <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">b</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-pink-600 font-medium">bKash</p>
                      <p className="font-bold text-gray-900">{vcard.payment_bkash}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(vcard.payment_bkash!);
                        setCopiedPayment('bkash');
                        setTimeout(() => setCopiedPayment(null), 2000);
                        trackLinkClick('copy_bkash');
                      }}
                    >
                      {copiedPayment === 'bkash' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </Button>
                  </div>
                )}
                
                {vcard.payment_nagad && (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">N</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-orange-600 font-medium">Nagad</p>
                      <p className="font-bold text-gray-900">{vcard.payment_nagad}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(vcard.payment_nagad!);
                        setCopiedPayment('nagad');
                        setTimeout(() => setCopiedPayment(null), 2000);
                        trackLinkClick('copy_nagad');
                      }}
                    >
                      {copiedPayment === 'nagad' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </Button>
                  </div>
                )}
                
                {vcard.payment_rocket && (
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">R</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-purple-600 font-medium">Rocket</p>
                      <p className="font-bold text-gray-900">{vcard.payment_rocket}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(vcard.payment_rocket!);
                        setCopiedPayment('rocket');
                        setTimeout(() => setCopiedPayment(null), 2000);
                        trackLinkClick('copy_rocket');
                      }}
                    >
                      {copiedPayment === 'rocket' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </Button>
                  </div>
                )}
                
                {vcard.payment_bank_details && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-600 font-medium mb-2">Bank Details</p>
                    <p className="text-gray-900 text-sm whitespace-pre-wrap">{vcard.payment_bank_details}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(vcard.payment_bank_details!);
                        setCopiedPayment('bank');
                        setTimeout(() => setCopiedPayment(null), 2000);
                        trackLinkClick('copy_bank');
                      }}
                    >
                      {copiedPayment === 'bank' ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
                      {copiedPayment === 'bank' ? 'Copied!' : 'Copy Details'}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Appointment Booking Modal */}
        {showAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowAppointmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className={`bg-gradient-to-r ${style.bg} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{vcard.appointment_title || 'Book Appointment'}</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/20"
                    onClick={() => setShowAppointmentModal(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                <p className="text-white/80 text-sm mt-1">Schedule a meeting with {vcard.name}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <Input
                    value={appointmentForm.name}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <Input
                    type="email"
                    value={appointmentForm.email}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone {vcard.require_phone_verification ? '*' : '(Optional)'}
                  </label>
                  <Input
                    value={appointmentForm.phone}
                    onChange={(e) => { setAppointmentForm(prev => ({ ...prev, phone: e.target.value })); setPhoneVerified(false); }}
                    placeholder="+8801XXXXXXXXX"
                  />
                  {vcard.require_phone_verification && appointmentForm.phone && (
                    <div className="mt-2">
                      <PhoneOtpVerifier
                        phone={appointmentForm.phone}
                        verified={phoneVerified}
                        onVerified={() => setPhoneVerified(true)}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <Input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value, time: '' }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">উপলভ্য টাইম স্লট *</label>
                  <BookingSlotPicker
                    vcardId={vcard.id}
                    date={appointmentForm.date}
                    startTime={vcard.appointment_start_time}
                    endTime={vcard.appointment_end_time}
                    durationMinutes={vcard.appointment_duration_minutes}
                    availableDays={vcard.appointment_available_days}
                    value={appointmentForm.time}
                    onChange={(t) => setAppointmentForm(prev => ({ ...prev, time: t }))}
                  />
                </div>

                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <Textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any message for the meeting..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Clock size={16} />
                  <span>Duration: {vcard.appointment_duration_minutes || 30} minutes</span>
                </div>
                
                <Button
                  onClick={handleBookAppointment}
                  disabled={bookingAppointment}
                  className={`w-full bg-gradient-to-r ${style.bg} hover:opacity-90 text-white font-semibold py-6`}
                >
                  {bookingAppointment ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar size={18} className="mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Testimonials */}
        {(vcard as any).testimonials_enabled !== false && (
          <div className="px-4 max-w-3xl mx-auto">
            <TestimonialsSection vcardId={vcard.id} />
            <div className="flex justify-center mb-6">
              <SaveContactButton vcardId={vcard.id} />
            </div>
          </div>
        )}

        {/* Footer */}
        {!(vcard as any).hide_branding && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>Powered by Digital Business Card</p>
          </div>
        )}
      </motion.div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={shareUrl}
        name={vcard.name}
        ogImageUrl={ogImageUrl}
      />

      {vcard.chat_enabled && (
        <VCardChatWidget slug={slug!} ownerName={vcard.name} />
      )}
    </div>
  );
}

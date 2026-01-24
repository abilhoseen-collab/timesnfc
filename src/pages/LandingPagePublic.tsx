import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  Star,
  Check,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Play,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface NavItem {
  label: string;
  link: string;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  favicon_url: string | null;
  theme_color: string;
  font_family: string;
  background_color: string;
  text_color: string;
  // Header settings
  header_logo_url: string | null;
  header_title: string | null;
  header_nav_items: NavItem[];
  header_sticky: boolean;
  header_show_cta: boolean;
  header_cta_text: string | null;
  header_cta_link: string | null;
  // Footer settings
  footer_copyright_text: string | null;
  footer_social_links: { platform: string; url: string }[];
  footer_additional_links: { label: string; url: string }[];
  footer_show_powered_by: boolean;
  footer_background_color: string | null;
}

interface LandingPageSection {
  id: string;
  section_type: string;
  title: string | null;
  content: Record<string, any>;
  settings: Record<string, any>;
  sort_order: number;
  is_visible: boolean;
}

export default function LandingPagePublic() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchLandingPage();
      trackView();
    }
  }, [slug]);

  const fetchLandingPage = async () => {
    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Parse JSON fields
    const parsedData: LandingPage = {
      ...data,
      header_nav_items: Array.isArray(data.header_nav_items) 
        ? (data.header_nav_items as unknown as NavItem[])
        : [],
      footer_social_links: Array.isArray(data.footer_social_links)
        ? (data.footer_social_links as unknown as { platform: string; url: string }[])
        : [],
      footer_additional_links: Array.isArray(data.footer_additional_links)
        ? (data.footer_additional_links as unknown as { label: string; url: string }[])
        : [],
    };

    setLandingPage(parsedData);

    // Fetch sections
    const { data: sectionsData } = await supabase
      .from('landing_page_sections')
      .select('*')
      .eq('landing_page_id', data.id)
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (sectionsData) {
      setSections(sectionsData as unknown as LandingPageSection[]);
    }
    setLoading(false);
  };

  const trackView = async () => {
    const { data } = await supabase
      .from('landing_pages')
      .select('id, total_views')
      .eq('slug', slug)
      .maybeSingle();

    if (data) {
      // Update total views
      await supabase
        .from('landing_pages')
        .update({ total_views: (data.total_views || 0) + 1 })
        .eq('id', data.id);

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
      
      const visitedKey = `visited_landing_${data.id}`;
      const isUnique = !sessionStorage.getItem(visitedKey);
      if (isUnique) {
        sessionStorage.setItem(visitedKey, 'true');
      }

      // Insert detailed analytics
      await supabase.from('landing_page_analytics').insert({
        landing_page_id: data.id,
        event_type: 'view',
        visitor_id: visitorId,
        session_id: sessionId,
        is_unique: isUnique,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingContact(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({ title: 'Message sent!', description: 'We\'ll get back to you soon.' });
    setContactForm({ name: '', email: '', message: '' });
    setSendingContact(false);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound || !landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or is not published.</p>
        </div>
      </div>
    );
  }

  const style = {
    '--theme-color': landingPage.theme_color,
    '--bg-color': landingPage.background_color,
    '--text-color': landingPage.text_color,
    fontFamily: landingPage.font_family,
  } as React.CSSProperties;

  const renderSection = (section: LandingPageSection) => {
    const content = section.content || {};

    switch (section.section_type) {
      case 'hero':
        return (
          <section
            key={section.id}
            className="relative py-20 lg:py-32"
            style={{
              backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {content.backgroundImage && (
              <div className="absolute inset-0 bg-black/50" />
            )}
            <div className="container mx-auto px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center"
              >
                <h1
                  className="text-4xl md:text-6xl font-bold mb-6"
                  style={{ color: content.backgroundImage ? '#ffffff' : landingPage.text_color }}
                >
                  {content.headline || 'Welcome'}
                </h1>
                <p
                  className="text-xl mb-8 opacity-80"
                  style={{ color: content.backgroundImage ? '#ffffff' : landingPage.text_color }}
                >
                  {content.subheadline}
                </p>
                {content.buttonText && (
                  <a
                    href={content.buttonLink || '#'}
                    className="inline-block px-8 py-4 rounded-xl font-semibold text-white transition-transform hover:scale-105"
                    style={{ backgroundColor: landingPage.theme_color }}
                  >
                    {content.buttonText}
                  </a>
                )}
              </motion.div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={section.id} className="py-16 lg:py-24">
            <div className="container mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-center mb-12" style={{ color: landingPage.text_color }}>
                  {section.title}
                </h2>
              )}
              <div className="grid md:grid-cols-3 gap-8">
                {(content.items || []).map((item: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-white/50 backdrop-blur border border-gray-100"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${landingPage.theme_color}20` }}
                    >
                      <Star size={24} style={{ color: landingPage.theme_color }} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: landingPage.text_color }}>
                      {item.title}
                    </h3>
                    <p className="opacity-70" style={{ color: landingPage.text_color }}>
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'about':
        return (
          <section key={section.id} className="py-16 lg:py-24">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {content.image && (
                  <motion.img
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    src={content.image}
                    alt={content.title || 'About'}
                    className="rounded-2xl shadow-xl"
                  />
                )}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-3xl font-bold mb-6" style={{ color: landingPage.text_color }}>
                    {content.title || section.title}
                  </h2>
                  <p className="text-lg opacity-80 whitespace-pre-line" style={{ color: landingPage.text_color }}>
                    {content.description}
                  </p>
                </motion.div>
              </div>
            </div>
          </section>
        );

      case 'services':
        return (
          <section key={section.id} className="py-16 lg:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-center mb-12" style={{ color: landingPage.text_color }}>
                  {section.title}
                </h2>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(content.items || []).map((item: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100"
                  >
                    <h3 className="text-xl font-semibold mb-2" style={{ color: landingPage.text_color }}>
                      {item.title}
                    </h3>
                    <p className="opacity-70 mb-4" style={{ color: landingPage.text_color }}>
                      {item.description}
                    </p>
                    {item.price && (
                      <p className="text-lg font-bold" style={{ color: landingPage.theme_color }}>
                        {item.price}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section key={section.id} className="py-16 lg:py-24">
            <div className="container mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-center mb-12" style={{ color: landingPage.text_color }}>
                  {section.title}
                </h2>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(content.items || []).map((item: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100"
                  >
                    <p className="text-lg mb-4 italic" style={{ color: landingPage.text_color }}>
                      "{item.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: landingPage.theme_color }}
                      >
                        {item.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: landingPage.text_color }}>
                          {item.name}
                        </p>
                        <p className="text-sm opacity-60" style={{ color: landingPage.text_color }}>
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'gallery':
        return (
          <section key={section.id} className="py-16 lg:py-24">
            <div className="container mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-center mb-12" style={{ color: landingPage.text_color }}>
                  {section.title}
                </h2>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(content.images || []).map((url: string, index: number) => (
                  <motion.img
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="rounded-xl w-full h-48 object-cover"
                  />
                ))}
              </div>
            </div>
          </section>
        );

      case 'video':
        return (
          <section key={section.id} className="py-16 lg:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
              {section.title && (
                <h2 className="text-3xl font-bold text-center mb-12" style={{ color: landingPage.text_color }}>
                  {section.title}
                </h2>
              )}
              <div className="max-w-4xl mx-auto">
                <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
                  <iframe
                    src={getYouTubeEmbedUrl(content.videoUrl || '')}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </section>
        );

      case 'text':
        return (
          <section key={section.id} className="py-16 lg:py-24">
            <div className="container mx-auto px-4 max-w-3xl">
              {content.heading && (
                <h2 className="text-3xl font-bold mb-6" style={{ color: landingPage.text_color }}>
                  {content.heading}
                </h2>
              )}
              <div
                className="prose prose-lg max-w-none"
                style={{ color: landingPage.text_color }}
              >
                <p className="whitespace-pre-line">{content.body}</p>
              </div>
            </div>
          </section>
        );

      case 'contact':
        return (
          <section key={section.id} className="py-16 lg:py-24 bg-gray-50" id="contact">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12" style={{ color: landingPage.text_color }}>
                {content.title || section.title || 'Contact Us'}
              </h2>
              <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                <div className="space-y-6">
                  {content.email && (
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${landingPage.theme_color}20` }}
                      >
                        <Mail size={24} style={{ color: landingPage.theme_color }} />
                      </div>
                      <div>
                        <p className="text-sm opacity-60" style={{ color: landingPage.text_color }}>Email</p>
                        <a href={`mailto:${content.email}`} className="font-medium" style={{ color: landingPage.text_color }}>
                          {content.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {content.phone && (
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${landingPage.theme_color}20` }}
                      >
                        <Phone size={24} style={{ color: landingPage.theme_color }} />
                      </div>
                      <div>
                        <p className="text-sm opacity-60" style={{ color: landingPage.text_color }}>Phone</p>
                        <a href={`tel:${content.phone}`} className="font-medium" style={{ color: landingPage.text_color }}>
                          {content.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {content.address && (
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${landingPage.theme_color}20` }}
                      >
                        <MapPin size={24} style={{ color: landingPage.theme_color }} />
                      </div>
                      <div>
                        <p className="text-sm opacity-60" style={{ color: landingPage.text_color }}>Address</p>
                        <p className="font-medium" style={{ color: landingPage.text_color }}>
                          {content.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {content.showForm !== false && (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <Input
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                    <Textarea
                      placeholder="Your Message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={4}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={sendingContact}
                      className="w-full"
                      style={{ backgroundColor: landingPage.theme_color }}
                    >
                      {sendingContact ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={18} className="mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </section>
        );

      case 'faq':
        return (
          <section key={section.id} className="py-16 lg:py-24">
            <div className="container mx-auto px-4 max-w-3xl">
              {section.title && (
                <h2 className="text-3xl font-bold text-center mb-12" style={{ color: landingPage.text_color }}>
                  {section.title}
                </h2>
              )}
              <div className="space-y-4">
                {(content.items || []).map((item: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === `${section.id}-${index}` ? null : `${section.id}-${index}`)}
                      className="w-full p-4 flex items-center justify-between text-left"
                      style={{ backgroundColor: 'white' }}
                    >
                      <span className="font-medium" style={{ color: landingPage.text_color }}>
                        {item.question}
                      </span>
                      {expandedFaq === `${section.id}-${index}` ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                    {expandedFaq === `${section.id}-${index}` && (
                      <div
                        className="p-4 pt-0 opacity-70"
                        style={{ color: landingPage.text_color }}
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section
            key={section.id}
            className="py-16 lg:py-24"
            style={{ backgroundColor: landingPage.theme_color }}
          >
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                {content.title || 'Ready to Get Started?'}
              </h2>
              <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto">
                {content.description}
              </p>
              {content.buttonText && (
                <a
                  href={content.buttonLink || '#'}
                  className="inline-block px-8 py-4 rounded-xl font-semibold transition-transform hover:scale-105"
                  style={{
                    backgroundColor: landingPage.background_color,
                    color: landingPage.theme_color,
                  }}
                >
                  {content.buttonText}
                </a>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>{landingPage.meta_title || landingPage.name}</title>
        {landingPage.meta_description && (
          <meta name="description" content={landingPage.meta_description} />
        )}
        {landingPage.og_image_url && (
          <meta property="og:image" content={landingPage.og_image_url} />
        )}
        {landingPage.favicon_url && (
          <link rel="icon" href={landingPage.favicon_url} />
        )}
        <style>{`
          body {
            font-family: ${landingPage.font_family}, sans-serif;
          }
        `}</style>
      </Helmet>

      <div
        className="min-h-screen"
        style={{
          backgroundColor: landingPage.background_color,
          color: landingPage.text_color,
          fontFamily: landingPage.font_family,
        }}
      >
        {/* Custom Header */}
        {(landingPage.header_title || landingPage.header_logo_url || (landingPage.header_nav_items && landingPage.header_nav_items.length > 0)) && (
          <header
            className={`${landingPage.header_sticky ? 'sticky top-0 z-50' : ''} bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm`}
          >
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                  {landingPage.header_logo_url && (
                    <img 
                      src={landingPage.header_logo_url} 
                      alt={landingPage.header_title || landingPage.name}
                      className="h-10 w-10 object-contain rounded-lg"
                    />
                  )}
                  {landingPage.header_title && (
                    <span className="font-bold text-lg" style={{ color: landingPage.text_color }}>
                      {landingPage.header_title}
                    </span>
                  )}
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                  {landingPage.header_nav_items?.map((item, index) => (
                    <a
                      key={index}
                      href={item.link}
                      className="text-sm font-medium transition-colors hover:opacity-70"
                      style={{ color: landingPage.text_color }}
                    >
                      {item.label}
                    </a>
                  ))}
                  {landingPage.header_show_cta && landingPage.header_cta_text && (
                    <a
                      href={landingPage.header_cta_link || '#contact'}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform hover:scale-105"
                      style={{ backgroundColor: landingPage.theme_color }}
                    >
                      {landingPage.header_cta_text}
                    </a>
                  )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>

              {/* Mobile Navigation */}
              {mobileMenuOpen && (
                <motion.nav
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="md:hidden py-4 border-t border-gray-100"
                >
                  <div className="flex flex-col gap-3">
                    {landingPage.header_nav_items?.map((item, index) => (
                      <a
                        key={index}
                        href={item.link}
                        className="text-sm font-medium py-2 transition-colors hover:opacity-70"
                        style={{ color: landingPage.text_color }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    ))}
                    {landingPage.header_show_cta && landingPage.header_cta_text && (
                      <a
                        href={landingPage.header_cta_link || '#contact'}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white text-center transition-transform hover:scale-105"
                        style={{ backgroundColor: landingPage.theme_color }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {landingPage.header_cta_text}
                      </a>
                    )}
                  </div>
                </motion.nav>
              )}
            </div>
          </header>
        )}

        {sections.map(renderSection)}

        {/* Footer */}
        <footer
          className="py-12 border-t"
          style={{ 
            borderColor: `${landingPage.text_color}20`,
            backgroundColor: landingPage.footer_background_color || 'transparent'
          }}
        >
          <div className="container mx-auto px-4">
            {/* Social Links */}
            {landingPage.footer_social_links && landingPage.footer_social_links.length > 0 && (
              <div className="flex justify-center gap-4 mb-6">
                {landingPage.footer_social_links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ 
                      backgroundColor: `${landingPage.theme_color}20`,
                      color: landingPage.theme_color
                    }}
                    title={link.platform}
                  >
                    {link.platform === 'facebook' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 36.6 36.6 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
                      </svg>
                    )}
                    {link.platform === 'instagram' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                      </svg>
                    )}
                    {link.platform === 'twitter' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    )}
                    {link.platform === 'youtube' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    )}
                    {link.platform === 'linkedin' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )}
                    {link.platform === 'website' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    )}
                    {link.platform === 'email' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {link.platform === 'phone' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )}
                    {link.platform === 'location' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            )}
            
            {/* Additional Links */}
            {landingPage.footer_additional_links && landingPage.footer_additional_links.length > 0 && (
              <div className="flex justify-center gap-6 mb-6 flex-wrap">
                {landingPage.footer_additional_links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    className="text-sm transition-colors hover:opacity-100 opacity-70"
                    style={{ color: landingPage.text_color }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            
            {/* Copyright */}
            <div className="text-center">
              <p className="opacity-60" style={{ color: landingPage.text_color }}>
                {landingPage.footer_copyright_text || `© ${new Date().getFullYear()} ${landingPage.name}. All rights reserved.`}
              </p>
              {(landingPage.footer_show_powered_by ?? true) && (
                <p className="text-sm mt-2 opacity-40" style={{ color: landingPage.text_color }}>
                  Powered by Times Digital
                </p>
              )}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

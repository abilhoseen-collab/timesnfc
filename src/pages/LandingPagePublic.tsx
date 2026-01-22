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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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

    setLandingPage(data);

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
    // Track page view (could be expanded to include analytics)
    const { data } = await supabase
      .from('landing_pages')
      .select('id, total_views')
      .eq('slug', slug)
      .maybeSingle();

    if (data) {
      await supabase
        .from('landing_pages')
        .update({ total_views: (data.total_views || 0) + 1 })
        .eq('id', data.id);
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
        {sections.map(renderSection)}

        {/* Footer */}
        <footer
          className="py-8 border-t"
          style={{ borderColor: `${landingPage.text_color}20` }}
        >
          <div className="container mx-auto px-4 text-center">
            <p className="opacity-60" style={{ color: landingPage.text_color }}>
              © {new Date().getFullYear()} {landingPage.name}. All rights reserved.
            </p>
            <p className="text-sm mt-2 opacity-40" style={{ color: landingPage.text_color }}>
              Powered by Times Digital
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorHandler';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Shield,
  Palette,
  Layout,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Type,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Star,
  Users,
  Phone,
  FileText,
  Layers,
  Lock,
  BarChart3,
} from 'lucide-react';
import logo from '@/assets/logo.png';
import LandingPageSectionEditor from '@/components/landing-builder/LandingPageSectionEditor';
import DomainManager from '@/components/landing-builder/DomainManager';
import SEOSettings from '@/components/landing-builder/SEOSettings';
import ThemeSettings from '@/components/landing-builder/ThemeSettings';
import HeaderEditor from '@/components/landing-builder/HeaderEditor';
import FooterEditor from '@/components/landing-builder/FooterEditor';
import LandingPageAnalytics from '@/components/landing-builder/LandingPageAnalytics';

interface NavItem {
  label: string;
  link: string;
}

interface LandingPage {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  ssl_status: string;
  domain_verified: boolean;
  is_published: boolean;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  favicon_url: string | null;
  theme_color: string;
  font_family: string;
  background_color: string;
  text_color: string;
  total_views: number;
  created_at: string;
  updated_at: string;
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
  landing_page_id: string;
  section_type: string;
  title: string | null;
  content: Record<string, any>;
  settings: Record<string, any>;
  sort_order: number;
  is_visible: boolean;
}

// Sortable wrapper component for drag and drop
interface SortableSectionWrapperProps {
  section: LandingPageSection;
  index: number;
  userId: string;
  onUpdate: (updates: Partial<LandingPageSection>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function SortableSectionWrapper({
  section,
  index,
  userId,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SortableSectionWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <LandingPageSectionEditor
        section={section}
        userId={userId}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        dragHandleProps={listeners}
      />
    </div>
  );
}

const sectionTypes = [
  { type: 'hero', icon: Layout, label: 'Hero Section', description: 'Main banner with headline and CTA' },
  { type: 'features', icon: Star, label: 'Features', description: 'Highlight key features or services' },
  { type: 'about', icon: Users, label: 'About', description: 'About section with image and text' },
  { type: 'services', icon: Layers, label: 'Services', description: 'List of services or products' },
  { type: 'testimonials', icon: MessageSquare, label: 'Testimonials', description: 'Customer reviews and feedback' },
  { type: 'gallery', icon: ImageIcon, label: 'Gallery', description: 'Image gallery or portfolio' },
  { type: 'video', icon: Video, label: 'Video', description: 'Embedded video section' },
  { type: 'text', icon: Type, label: 'Text Block', description: 'Custom text content' },
  { type: 'contact', icon: Phone, label: 'Contact', description: 'Contact form and information' },
  { type: 'faq', icon: FileText, label: 'FAQ', description: 'Frequently asked questions' },
  { type: 'cta', icon: ExternalLink, label: 'Call to Action', description: 'Conversion-focused CTA section' },
];

export default function LandingPageBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { 
    canCreateLandingPage, 
    currentLandingPages, 
    landingPageLimit, 
    hasActiveSubscription, 
    isLoading: limitsLoading,
    packageName 
  } = useSubscriptionLimits();
  
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('sections');
  const [showAddSection, setShowAddSection] = useState(false);
  const isEditing = !!id;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect to payment if no active subscription (only for new pages)
  useEffect(() => {
    if (!limitsLoading && !hasActiveSubscription && !isEditing) {
      toast({
        title: 'সাবস্ক্রিপশন প্রয়োজন',
        description: 'ল্যান্ডিং পেইজ তৈরি করতে একটি প্যাকেজ কিনুন।',
        variant: 'destructive',
      });
      navigate('/payment');
    }
  }, [limitsLoading, hasActiveSubscription, isEditing, navigate, toast]);

  // Check limits for new landing pages
  useEffect(() => {
    if (!limitsLoading && hasActiveSubscription && !isEditing && !canCreateLandingPage) {
      toast({
        title: 'লিমিট শেষ',
        description: `আপনার ${packageName} প্ল্যানে সর্বোচ্চ ${landingPageLimit}টি ল্যান্ডিং পেইজ তৈরি করা যায়। বর্তমানে ${currentLandingPages}টি আছে।`,
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [limitsLoading, hasActiveSubscription, isEditing, canCreateLandingPage, landingPageLimit, currentLandingPages, packageName, navigate, toast]);

  useEffect(() => {
    if (user && id && hasActiveSubscription) {
      fetchLandingPage();
    } else if (user && !id && hasActiveSubscription && canCreateLandingPage) {
      setLoading(false);
    }
  }, [user, id, hasActiveSubscription, canCreateLandingPage]);

  const fetchLandingPage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: 'পেইজ পাওয়া যায়নি', variant: 'destructive' });
        navigate('/dashboard');
        return;
      }

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
      setName(data.name);
      setSlug(data.slug);

      const { data: sectionsData, error: sErr } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('landing_page_id', data.id)
        .order('sort_order', { ascending: true });

      if (sErr) throw sErr;
      if (sectionsData) setSections(sectionsData as unknown as LandingPageSection[]);
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const createLandingPage = async () => {
    if (!name.trim()) {
      toast({ title: 'পেইজের নাম দিন', variant: 'destructive' });
      return;
    }

    const generatedSlug = slug.trim() || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          user_id: user?.id,
          name: name.trim(),
          slug: generatedSlug,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Insert returned no row');

      toast({ title: 'ল্যান্ডিং পেইজ তৈরি হয়েছে!' });
      navigate(`/landing-builder/${data.id}`);
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveLandingPage = async () => {
    if (!landingPage) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_pages')
        .update({ name, slug })
        .eq('id', landingPage.id)
        .eq('user_id', user?.id);
      if (error) throw error;
      toast({ title: 'পরিবর্তন সংরক্ষিত হয়েছে!' });
      setLandingPage({ ...landingPage, name, slug });
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!landingPage) return;
    try {
      const newVal = !landingPage.is_published;
      const { error } = await supabase
        .from('landing_pages')
        .update({ is_published: newVal })
        .eq('id', landingPage.id)
        .eq('user_id', user?.id);
      if (error) throw error;
      setLandingPage({ ...landingPage, is_published: newVal });
      toast({
        title: newVal ? 'পেইজ প্রকাশিত হয়েছে!' : 'পেইজ আনপাবলিশ করা হয়েছে',
        description: newVal ? 'আপনার ল্যান্ডিং পেইজ এখন লাইভ।' : '',
      });
    } catch (err) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(err), variant: 'destructive' });
    }
  };

  const addSection = async (type: string) => {
    if (!landingPage) return;

    const defaultContent = getDefaultContent(type);
    const newSortOrder = sections.length;

    const { data, error } = await supabase
      .from('landing_page_sections')
      .insert({
        landing_page_id: landingPage.id,
        section_type: type,
        title: sectionTypes.find(s => s.type === type)?.label || 'New Section',
        content: defaultContent,
        settings: {},
        sort_order: newSortOrder,
        is_visible: true,
      })
      .select()
      .single();

    if (!error && data) {
      setSections([...sections, data as unknown as LandingPageSection]);
      toast({ title: 'Section added!' });
    }
    setShowAddSection(false);
  };

  const getDefaultContent = (type: string): Record<string, any> => {
    switch (type) {
      case 'hero':
        return {
          headline: 'Welcome to Our Website',
          subheadline: 'Create amazing experiences for your customers',
          buttonText: 'Get Started',
          buttonLink: '#',
          backgroundImage: '',
        };
      case 'features':
        return {
          items: [
            { icon: 'star', title: 'Feature 1', description: 'Description of feature 1' },
            { icon: 'shield', title: 'Feature 2', description: 'Description of feature 2' },
            { icon: 'zap', title: 'Feature 3', description: 'Description of feature 3' },
          ],
        };
      case 'about':
        return {
          title: 'About Us',
          description: 'Tell your story here...',
          image: '',
        };
      case 'services':
        return {
          items: [
            { title: 'Service 1', description: 'Description', price: '', icon: 'briefcase' },
          ],
        };
      case 'testimonials':
        return {
          items: [
            { name: 'Customer Name', role: 'CEO', content: 'Great service!', avatar: '' },
          ],
        };
      case 'gallery':
        return { images: [] };
      case 'video':
        return { videoUrl: '', videoType: 'youtube' };
      case 'text':
        return { heading: '', body: '' };
      case 'contact':
        return {
          title: 'Contact Us',
          email: '',
          phone: '',
          address: '',
          showForm: true,
        };
      case 'faq':
        return {
          items: [
            { question: 'Question 1?', answer: 'Answer 1' },
          ],
        };
      case 'cta':
        return {
          title: 'Ready to Get Started?',
          description: 'Join thousands of happy customers today.',
          buttonText: 'Sign Up Now',
          buttonLink: '#',
        };
      default:
        return {};
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<LandingPageSection>) => {
    const { error } = await supabase
      .from('landing_page_sections')
      .update(updates)
      .eq('id', sectionId);

    if (!error) {
      setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
    }
  };

  const deleteSection = async (sectionId: string) => {
    const { error } = await supabase
      .from('landing_page_sections')
      .delete()
      .eq('id', sectionId);

    if (!error) {
      setSections(sections.filter(s => s.id !== sectionId));
      toast({ title: 'Section deleted' });
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    // Update sort orders
    await saveSectionOrder(newSections);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      
      await saveSectionOrder(newSections);
    }
  };

  const saveSectionOrder = async (orderedSections: LandingPageSection[]) => {
    const updates = orderedSections.map((s, i) => ({ id: s.id, sort_order: i }));
    
    for (const update of updates) {
      await supabase
        .from('landing_page_sections')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    setSections(orderedSections.map((s, i) => ({ ...s, sort_order: i })));
  };

  const getPageUrl = () => {
    if (landingPage?.custom_domain && landingPage.domain_verified) {
      return `https://${landingPage.custom_domain}`;
    }
    return `${window.location.origin}/site/${landingPage?.slug}`;
  };

  const copyPageUrl = () => {
    navigator.clipboard.writeText(getPageUrl());
    toast({ title: 'URL copied!' });
  };

  if (authLoading || loading || limitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show subscription required message if trying to access without subscription
  if (hasActiveSubscription === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ল্যান্ডিং পেইজ তৈরি বা এডিট করতে সক্রিয় সাবস্ক্রিপশন প্রয়োজন।
            </AlertDescription>
          </Alert>
          <Button variant="secondary" onClick={() => navigate('/payment')}>
            প্যাকেজ কিনুন
          </Button>
        </div>
      </div>
    );
  }

  // Create new page form
  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
        <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
          <div className="container-custom flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
              <img src={logo} alt="Times Digital" className="h-8" />
            </div>
          </div>
        </header>

        <main className="container-custom py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
          >
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layout size={32} className="text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Create New Landing Page
                </h1>
                <p className="text-muted-foreground">
                  Build a professional website with custom domain and SSL support
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="name">Page Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Business Website"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug (optional)</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm text-muted-foreground">{window.location.origin}/site/</span>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-business"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to auto-generate from page name
                  </p>
                </div>

                <Button
                  onClick={createLandingPage}
                  disabled={saving || !name.trim()}
                  className="w-full"
                >
                  {saving ? 'Creating...' : 'Create Landing Page'}
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <div className="hidden sm:block">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-semibold bg-transparent border-none focus:ring-0 w-48"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {landingPage?.is_published && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                <CheckCircle size={14} />
                <span className="hidden sm:inline">Published</span>
              </div>
            )}
            
            <Button variant="outline" size="sm" onClick={copyPageUrl}>
              <Copy size={16} className="mr-2" />
              <span className="hidden sm:inline">Copy URL</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(getPageUrl(), '_blank')}
            >
              <Eye size={16} className="mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>

            <Button variant="outline" size="sm" onClick={saveLandingPage} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>

            <Button 
              onClick={togglePublish}
              variant={landingPage?.is_published ? 'secondary' : 'default'}
            >
              {landingPage?.is_published ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container-custom py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Layout size={16} />
              Sections
            </TabsTrigger>
            <TabsTrigger value="header" className="flex items-center gap-2">
              <Layers size={16} />
              Header
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <FileText size={16} />
              Footer
            </TabsTrigger>
            <TabsTrigger value="domain" className="flex items-center gap-2">
              <Globe size={16} />
              Domain & SSL
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search size={16} />
              SEO
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette size={16} />
              Theme
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Sections Tab */}
          <TabsContent value="sections">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Sections List */}
              <div className="lg:col-span-2 space-y-4">
                {sections.length === 0 ? (
                  <div className="bg-card rounded-2xl p-12 border border-dashed border-border text-center">
                    <Layers size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No sections yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first section to start building your landing page
                    </p>
                    <Button onClick={() => setShowAddSection(true)}>
                      <Plus size={18} className="mr-2" />
                      Add Section
                    </Button>
                  </div>
                ) : (
                  <>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={sections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {sections.map((section, index) => (
                            <SortableSectionWrapper
                              key={section.id}
                              section={section}
                              index={index}
                              userId={user?.id || ''}
                              onUpdate={(updates) => updateSection(section.id, updates)}
                              onDelete={() => deleteSection(section.id)}
                              onMoveUp={() => moveSection(index, 'up')}
                              onMoveDown={() => moveSection(index, 'down')}
                              canMoveUp={index > 0}
                              canMoveDown={index < sections.length - 1}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed"
                      onClick={() => setShowAddSection(true)}
                    >
                      <Plus size={18} className="mr-2" />
                      Add Section
                    </Button>
                  </>
                )}
              </div>

              {/* Add Section Panel */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
                  <h3 className="font-semibold text-foreground mb-4">Available Sections</h3>
                  <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {sectionTypes.map((section) => (
                      <button
                        key={section.type}
                        onClick={() => addSection(section.type)}
                        className="w-full p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left flex items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <section.icon size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{section.label}</p>
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Header Tab */}
          <TabsContent value="header">
            {landingPage && (
              <div className="max-w-2xl">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <HeaderEditor
                    landingPageId={landingPage.id}
                    userId={user?.id || ''}
                    initialSettings={{
                      header_logo_url: landingPage.header_logo_url,
                      header_title: landingPage.header_title,
                      header_nav_items: landingPage.header_nav_items || [],
                      header_sticky: landingPage.header_sticky ?? true,
                      header_show_cta: landingPage.header_show_cta ?? true,
                      header_cta_text: landingPage.header_cta_text,
                      header_cta_link: landingPage.header_cta_link,
                    }}
                    onUpdate={(updates) => setLandingPage({ ...landingPage, ...updates })}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer">
            {landingPage && (
              <div className="max-w-2xl">
                <FooterEditor
                  settings={{
                    footer_copyright_text: landingPage.footer_copyright_text || '© 2024 All rights reserved.',
                    footer_social_links: landingPage.footer_social_links || [],
                    footer_additional_links: landingPage.footer_additional_links || [],
                    footer_show_powered_by: landingPage.footer_show_powered_by ?? true,
                    footer_background_color: landingPage.footer_background_color,
                  }}
                  onUpdate={async (updates) => {
                    const dbUpdates = {
                      footer_copyright_text: updates.footer_copyright_text,
                      footer_social_links: updates.footer_social_links as unknown as any,
                      footer_additional_links: updates.footer_additional_links as unknown as any,
                      footer_show_powered_by: updates.footer_show_powered_by,
                      footer_background_color: updates.footer_background_color,
                    };
                    const { error } = await supabase
                      .from('landing_pages')
                      .update(dbUpdates)
                      .eq('id', landingPage.id);
                    
                    if (!error) {
                      setLandingPage({ ...landingPage, ...updates });
                      toast({ title: 'Footer settings saved' });
                    }
                  }}
                  saving={saving}
                />
              </div>
            )}
          </TabsContent>

          {/* Domain Tab */}
          <TabsContent value="domain">
            {landingPage && (
              <DomainManager
                landingPage={landingPage}
                onUpdate={(updates) => setLandingPage({ ...landingPage, ...updates })}
              />
            )}
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo">
            {landingPage && (
              <SEOSettings
                landingPage={landingPage}
                onUpdate={(updates) => setLandingPage({ ...landingPage, ...updates })}
              />
            )}
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            {landingPage && (
              <ThemeSettings
                landingPage={landingPage}
                onUpdate={(updates) => setLandingPage({ ...landingPage, ...updates })}
              />
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {landingPage && (
              <LandingPageAnalytics
                landingPageId={landingPage.id}
                totalViews={landingPage.total_views || 0}
                sections={sections.map(s => ({
                  id: s.id,
                  section_type: s.section_type,
                  title: s.title,
                  is_visible: s.is_visible,
                }))}
                createdAt={landingPage.created_at}
              />
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="max-w-2xl">
              <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
                <h3 className="font-semibold text-foreground">Page Settings</h3>
                
                <div>
                  <Label htmlFor="page-name">Page Name</Label>
                  <Input
                    id="page-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="page-slug">URL Slug</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm text-muted-foreground">/site/</span>
                    <Input
                      id="page-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Publish Status</p>
                    <p className="text-sm text-muted-foreground">
                      {landingPage?.is_published ? 'Your page is live' : 'Your page is in draft mode'}
                    </p>
                  </div>
                  <Switch
                    checked={landingPage?.is_published}
                    onCheckedChange={togglePublish}
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-2">Page URL</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-accent rounded-lg text-sm break-all">
                      {getPageUrl()}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyPageUrl}>
                      <Copy size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(getPageUrl(), '_blank')}
                    >
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>

                <Button onClick={saveLandingPage} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

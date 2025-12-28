import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Home,
  Star,
  Users,
  MessageSquare,
  HelpCircle,
  Megaphone,
  Mail,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface HomePageSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any>;
  is_visible: boolean;
  sort_order: number;
}

const sectionIcons: Record<string, React.ElementType> = {
  hero: Home,
  features: Star,
  about: Users,
  testimonials: MessageSquare,
  faq: HelpCircle,
  cta: Megaphone,
  contact: Mail,
};

const sectionLabels: Record<string, string> = {
  hero: 'Hero Section (ল্যান্ডিং এরিয়া)',
  features: 'Features Section (ফিচার সমূহ)',
  about: 'About Section (আমাদের সম্পর্কে)',
  testimonials: 'Testimonials (রিভিউ/মতামত)',
  faq: 'FAQ Section (প্রশ্নোত্তর)',
  cta: 'CTA Section (কল টু অ্যাকশন)',
  contact: 'Contact Section (যোগাযোগ)',
};

export default function HomePageContentManager() {
  const { toast } = useToast();
  const [sections, setSections] = useState<HomePageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('home_page_content')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setSections(data as HomePageSection[]);
    }
    setLoading(false);
  };

  const updateSection = async (id: string, updates: Partial<HomePageSection>) => {
    setSaving(id);
    
    const { error } = await supabase
      .from('home_page_content')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'আপডেট ব্যর্থ হয়েছে', variant: 'destructive' });
    } else {
      setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
      toast({ title: 'সফলভাবে আপডেট হয়েছে' });
    }
    setSaving(null);
  };

  const handleContentChange = (sectionId: string, key: string, value: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          content: { ...s.content, [key]: value }
        };
      }
      return s;
    }));
  };

  const saveContent = async (section: HomePageSection) => {
    await updateSection(section.id, { 
      title: section.title,
      subtitle: section.subtitle,
      content: section.content,
      is_visible: section.is_visible
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">হোম পেজ কন্টেন্ট ম্যানেজমেন্ট</h2>
          <p className="text-sm text-muted-foreground">
            সব সেকশনের টাইটেল, সাবটাইটেল ও কন্টেন্ট কাস্টমাইজ করুন
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {sections.map((section) => {
          const Icon = sectionIcons[section.section_key] || Home;
          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">
                      {sectionLabels[section.section_key] || section.section_key}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {section.is_visible ? 'দৃশ্যমান' : 'লুকানো'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.is_visible ? (
                      <Eye size={16} className="text-green-500" />
                    ) : (
                      <EyeOff size={16} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">সেকশন দৃশ্যমানতা</p>
                      <p className="text-xs text-muted-foreground">এই সেকশন হোম পেজে দেখাবে কিনা</p>
                    </div>
                    <Switch
                      checked={section.is_visible}
                      onCheckedChange={(checked) => 
                        setSections(sections.map(s => s.id === section.id ? { ...s, is_visible: checked } : s))
                      }
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2">টাইটেল</label>
                    <Input
                      value={section.title || ''}
                      onChange={(e) => 
                        setSections(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))
                      }
                      placeholder="সেকশন টাইটেল লিখুন"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-sm font-medium mb-2">সাবটাইটেল</label>
                    <Textarea
                      value={section.subtitle || ''}
                      onChange={(e) => 
                        setSections(sections.map(s => s.id === section.id ? { ...s, subtitle: e.target.value } : s))
                      }
                      placeholder="সেকশন সাবটাইটেল লিখুন"
                      rows={2}
                    />
                  </div>

                  {/* Section-specific content editors */}
                  {section.section_key === 'hero' && (
                    <HeroContentEditor
                      content={section.content}
                      onChange={(key, value) => handleContentChange(section.id, key, value)}
                    />
                  )}

                  {section.section_key === 'features' && (
                    <FeaturesContentEditor
                      content={section.content}
                      onChange={(key, value) => handleContentChange(section.id, key, value)}
                    />
                  )}

                  {section.section_key === 'testimonials' && (
                    <TestimonialsContentEditor
                      content={section.content}
                      onChange={(key, value) => handleContentChange(section.id, key, value)}
                    />
                  )}

                  {section.section_key === 'faq' && (
                    <FAQContentEditor
                      content={section.content}
                      onChange={(key, value) => handleContentChange(section.id, key, value)}
                    />
                  )}

                  {section.section_key === 'about' && (
                    <AboutContentEditor
                      content={section.content}
                      onChange={(key, value) => handleContentChange(section.id, key, value)}
                    />
                  )}

                  {section.section_key === 'cta' && (
                    <CTAContentEditor
                      content={section.content}
                      onChange={(key, value) => handleContentChange(section.id, key, value)}
                    />
                  )}

                  {section.section_key === 'contact' && (
                    <ContactContentEditor
                      content={section.content}
                      onChange={(key, value) => handleContentChange(section.id, key, value)}
                    />
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={() => saveContent(section)}
                    disabled={saving === section.id}
                    className="w-full"
                  >
                    {saving === section.id ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Save size={16} className="mr-2" />
                    )}
                    পরিবর্তন সংরক্ষণ করুন
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// Hero Section Editor
function HeroContentEditor({ content, onChange }: { content: Record<string, any>; onChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <h4 className="font-medium text-sm">Hero কন্টেন্ট</h4>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">ব্যাজ টেক্সট</label>
        <Input
          value={content.badge_text || ''}
          onChange={(e) => onChange('badge_text', e.target.value)}
          placeholder="e.g. IT Solution"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">প্রাইমারি বাটন</label>
          <Input
            value={content.cta_primary || ''}
            onChange={(e) => onChange('cta_primary', e.target.value)}
            placeholder="e.g. Start Free Trial"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">সেকেন্ডারি বাটন</label>
          <Input
            value={content.cta_secondary || ''}
            onChange={(e) => onChange('cta_secondary', e.target.value)}
            placeholder="e.g. Watch Demo"
          />
        </div>
      </div>
      {/* Stats Editor */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">স্ট্যাটিস্টিক্স</label>
        {(content.stats || []).map((stat: any, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              value={stat.value || ''}
              onChange={(e) => {
                const newStats = [...(content.stats || [])];
                newStats[index] = { ...newStats[index], value: e.target.value };
                onChange('stats', newStats);
              }}
              placeholder="e.g. 10K+"
              className="w-24"
            />
            <Input
              value={stat.label || ''}
              onChange={(e) => {
                const newStats = [...(content.stats || [])];
                newStats[index] = { ...newStats[index], label: e.target.value };
                onChange('stats', newStats);
              }}
              placeholder="e.g. Active Users"
              className="flex-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Features Section Editor
function FeaturesContentEditor({ content, onChange }: { content: Record<string, any>; onChange: (key: string, value: any) => void }) {
  const features = content.features || [];

  const updateFeature = (index: number, field: string, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    onChange('features', newFeatures);
  };

  const addFeature = () => {
    onChange('features', [...features, { title: '', description: '', icon: 'Star' }]);
  };

  const removeFeature = (index: number) => {
    onChange('features', features.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">ফিচার লিস্ট</h4>
        <Button variant="outline" size="sm" onClick={addFeature}>
          <Plus size={14} className="mr-1" /> যোগ করুন
        </Button>
      </div>
      {features.map((feature: any, index: number) => (
        <div key={index} className="p-3 bg-background rounded-lg border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ফিচার {index + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => removeFeature(index)} className="h-6 w-6 text-destructive">
              <Trash2 size={12} />
            </Button>
          </div>
          <Input
            value={feature.title || ''}
            onChange={(e) => updateFeature(index, 'title', e.target.value)}
            placeholder="ফিচার টাইটেল"
          />
          <Textarea
            value={feature.description || ''}
            onChange={(e) => updateFeature(index, 'description', e.target.value)}
            placeholder="ফিচার বিবরণ"
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}

// Testimonials Editor
function TestimonialsContentEditor({ content, onChange }: { content: Record<string, any>; onChange: (key: string, value: any) => void }) {
  const testimonials = content.testimonials || [];

  const updateTestimonial = (index: number, field: string, value: string | number) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    onChange('testimonials', newTestimonials);
  };

  const addTestimonial = () => {
    onChange('testimonials', [...testimonials, { name: '', role: '', company: '', content: '', rating: 5 }]);
  };

  const removeTestimonial = (index: number) => {
    onChange('testimonials', testimonials.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">গ্রাহক মতামত</h4>
        <Button variant="outline" size="sm" onClick={addTestimonial}>
          <Plus size={14} className="mr-1" /> যোগ করুন
        </Button>
      </div>
      {testimonials.map((t: any, index: number) => (
        <div key={index} className="p-3 bg-background rounded-lg border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">মতামত {index + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => removeTestimonial(index)} className="h-6 w-6 text-destructive">
              <Trash2 size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={t.name || ''} onChange={(e) => updateTestimonial(index, 'name', e.target.value)} placeholder="নাম" />
            <Input value={t.role || ''} onChange={(e) => updateTestimonial(index, 'role', e.target.value)} placeholder="পদবি" />
          </div>
          <Input value={t.company || ''} onChange={(e) => updateTestimonial(index, 'company', e.target.value)} placeholder="কোম্পানি" />
          <Textarea value={t.content || ''} onChange={(e) => updateTestimonial(index, 'content', e.target.value)} placeholder="মতামত" rows={2} />
        </div>
      ))}
    </div>
  );
}

// FAQ Editor
function FAQContentEditor({ content, onChange }: { content: Record<string, any>; onChange: (key: string, value: any) => void }) {
  const faqs = content.faqs || [];

  const updateFAQ = (index: number, field: string, value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    onChange('faqs', newFaqs);
  };

  const addFAQ = () => {
    onChange('faqs', [...faqs, { question: '', answer: '' }]);
  };

  const removeFAQ = (index: number) => {
    onChange('faqs', faqs.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">প্রশ্নোত্তর</h4>
        <Button variant="outline" size="sm" onClick={addFAQ}>
          <Plus size={14} className="mr-1" /> যোগ করুন
        </Button>
      </div>
      {faqs.map((faq: any, index: number) => (
        <div key={index} className="p-3 bg-background rounded-lg border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">প্রশ্ন {index + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => removeFAQ(index)} className="h-6 w-6 text-destructive">
              <Trash2 size={12} />
            </Button>
          </div>
          <Input value={faq.question || ''} onChange={(e) => updateFAQ(index, 'question', e.target.value)} placeholder="প্রশ্ন লিখুন" />
          <Textarea value={faq.answer || ''} onChange={(e) => updateFAQ(index, 'answer', e.target.value)} placeholder="উত্তর লিখুন" rows={2} />
        </div>
      ))}
    </div>
  );
}

// About Section Editor
function AboutContentEditor({ content, onChange }: { content: Record<string, any>; onChange: (key: string, value: any) => void }) {
  const ecosystem = content.ecosystem || [];

  const updateEcosystem = (index: number, field: string, value: string) => {
    const newEcosystem = [...ecosystem];
    newEcosystem[index] = { ...newEcosystem[index], [field]: value };
    onChange('ecosystem', newEcosystem);
  };

  const addEcosystem = () => {
    onChange('ecosystem', [...ecosystem, { name: '', desc: '' }]);
  };

  const removeEcosystem = (index: number) => {
    onChange('ecosystem', ecosystem.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <h4 className="font-medium text-sm">About কন্টেন্ট</h4>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">স্টোরি টাইটেল</label>
        <Input
          value={content.story_title || ''}
          onChange={(e) => onChange('story_title', e.target.value)}
          placeholder="e.g. Empowering Professional Connections Since 2025"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">স্টোরি টেক্সট</label>
        <Textarea
          value={content.story_text || ''}
          onChange={(e) => onChange('story_text', e.target.value)}
          placeholder="আমাদের গল্প লিখুন..."
          rows={3}
        />
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <h5 className="font-medium text-sm">ইকোসিস্টেম কোম্পানি</h5>
        <Button variant="outline" size="sm" onClick={addEcosystem}>
          <Plus size={14} className="mr-1" /> যোগ করুন
        </Button>
      </div>
      {ecosystem.map((item: any, index: number) => (
        <div key={index} className="flex gap-2 items-center">
          <Input value={item.name || ''} onChange={(e) => updateEcosystem(index, 'name', e.target.value)} placeholder="নাম" className="flex-1" />
          <Input value={item.desc || ''} onChange={(e) => updateEcosystem(index, 'desc', e.target.value)} placeholder="বিবরণ" className="flex-1" />
          <Button variant="ghost" size="icon" onClick={() => removeEcosystem(index)} className="h-8 w-8 text-destructive">
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
    </div>
  );
}

// CTA Section Editor
function CTAContentEditor({ content, onChange }: { content: Record<string, any>; onChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <h4 className="font-medium text-sm">CTA কন্টেন্ট</h4>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">বাটন টেক্সট</label>
        <Input
          value={content.button_text || ''}
          onChange={(e) => onChange('button_text', e.target.value)}
          placeholder="e.g. Get Started Free"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">সেকেন্ডারি টেক্সট</label>
        <Input
          value={content.secondary_text || ''}
          onChange={(e) => onChange('secondary_text', e.target.value)}
          placeholder="e.g. No credit card required"
        />
      </div>
    </div>
  );
}

// Contact Section Editor
function ContactContentEditor({ content, onChange }: { content: Record<string, any>; onChange: (key: string, value: any) => void }) {
  const socialLinks = content.social_links || {};

  const updateSocialLink = (platform: string, value: string) => {
    onChange('social_links', { ...socialLinks, [platform]: value });
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <h4 className="font-medium text-sm">যোগাযোগ তথ্য</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">ইমেইল</label>
          <Input value={content.email || ''} onChange={(e) => onChange('email', e.target.value)} placeholder="support@example.com" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">ফোন</label>
          <Input value={content.phone || ''} onChange={(e) => onChange('phone', e.target.value)} placeholder="+880 1234-567890" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">ঠিকানা</label>
        <Input value={content.address || ''} onChange={(e) => onChange('address', e.target.value)} placeholder="Dhaka, Bangladesh" />
      </div>
      
      <h5 className="font-medium text-sm mt-4">সোশ্যাল মিডিয়া লিংক</h5>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Facebook</label>
          <Input value={socialLinks.facebook || ''} onChange={(e) => updateSocialLink('facebook', e.target.value)} placeholder="https://facebook.com/..." />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Twitter</label>
          <Input value={socialLinks.twitter || ''} onChange={(e) => updateSocialLink('twitter', e.target.value)} placeholder="https://twitter.com/..." />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">LinkedIn</label>
          <Input value={socialLinks.linkedin || ''} onChange={(e) => updateSocialLink('linkedin', e.target.value)} placeholder="https://linkedin.com/..." />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Instagram</label>
          <Input value={socialLinks.instagram || ''} onChange={(e) => updateSocialLink('instagram', e.target.value)} placeholder="https://instagram.com/..." />
        </div>
      </div>
    </div>
  );
}

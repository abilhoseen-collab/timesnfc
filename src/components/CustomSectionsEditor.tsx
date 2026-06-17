import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Type,
  Image as ImageIcon,
  CreditCard,
  Loader2,
  Save,
  Video,
  Quote,
  ShoppingBag,
  Award,
  HelpCircle,
  MessageSquare,
  Images,
  Check,
  Cloud,
} from 'lucide-react';
import { SortableSection } from './SortableSection';

export type SectionType = 'text' | 'image_gallery' | 'service_card' | 'video' | 'testimonial' | 'product_catalog' | 'product_gallery' | 'social_proof' | 'faq' | 'contact_form';

export interface CustomSection {
  id: string;
  vcard_id: string;
  section_type: SectionType;
  title: string | null;
  content: Record<string, any>;
  sort_order: number;
  is_visible: boolean;
}

interface CustomSectionsEditorProps {
  vcardId: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const sectionTypes = [
  { type: 'text' as SectionType, icon: Type, label: 'টেক্সট সেকশন', description: 'হেডিং এবং প্যারাগ্রাফ টেক্সট' },
  { type: 'image_gallery' as SectionType, icon: ImageIcon, label: 'ইমেজ গ্যালারি', description: 'ছবির গ্যালারি ও স্লাইডার' },
  { type: 'service_card' as SectionType, icon: CreditCard, label: 'সার্ভিস ক্যাটালগ', description: 'সার্ভিস লিস্ট ও কার্ট চেকআউট' },
  { type: 'product_catalog' as SectionType, icon: ShoppingBag, label: 'প্রোডাক্ট শপ', description: 'প্রোডাক্ট ও মোবাইল পেমেন্ট চেকআউট' },
  { type: 'product_gallery' as SectionType, icon: Images, label: 'প্রোডাক্ট গ্যালারি', description: 'ভিজ্যুয়াল গ্যালারি ও লাইটবক্স' },
  { type: 'video' as SectionType, icon: Video, label: 'ভিডিও এম্বেড', description: 'YouTube, Vimeo ভিডিও' },
  { type: 'testimonial' as SectionType, icon: Quote, label: 'টেস্টিমোনিয়াল', description: 'ক্লায়েন্ট রিভিউ ও ফিডব্যাক' },
  { type: 'social_proof' as SectionType, icon: Award, label: 'সোশ্যাল প্রুফ ব্যাজ', description: 'ভেরিফাইড বিজনেস ব্যাজ' },
  { type: 'faq' as SectionType, icon: HelpCircle, label: 'FAQ সেকশন', description: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী' },
  { type: 'contact_form' as SectionType, icon: MessageSquare, label: 'যোগাযোগ ফর্ম', description: 'ভিজিটরদের মেসেজ পাঠানোর ফর্ম' },
];

export default function CustomSectionsEditor({ vcardId }: CustomSectionsEditorProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (vcardId) {
      fetchSections();
    }
  }, [vcardId]);

  // Clear save status after showing "saved"
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vcard_custom_sections')
      .select('*')
      .eq('vcard_id', vcardId)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setSections(data as CustomSection[]);
    }
    setLoading(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addSection = async (type: SectionType) => {
    setAdding(true);
    const defaultContent = getDefaultContent(type);
    const newSortOrder = sections.length;

    try {
      const { data, error } = await supabase
        .from('vcard_custom_sections')
        .insert({
          vcard_id: vcardId,
          section_type: type,
          title: getDefaultTitle(type),
          content: defaultContent,
          sort_order: newSortOrder,
          is_visible: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to add section:', error);
        toast({ title: 'সেকশন যোগ করতে ব্যর্থ হয়েছে', description: error.message, variant: 'destructive' });
      } else if (data) {
        setSections(prev => [...prev, data as CustomSection]);
        toast({ title: 'সেকশন যোগ হয়েছে!' });
      }
    } catch (err) {
      console.error('Error adding section:', err);
      toast({ title: 'সেকশন যোগ করতে ব্যর্থ', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const getDefaultTitle = (type: SectionType): string => {
    switch (type) {
      case 'text': return 'আমার সম্পর্কে';
      case 'image_gallery': return 'গ্যালারি';
      case 'service_card': return 'সার্ভিস সমূহ';
      case 'product_catalog': return 'প্রোডাক্ট সমূহ';
      case 'product_gallery': return 'প্রোডাক্ট গ্যালারি';
      case 'video': return 'ভিডিও';
      case 'testimonial': return 'ক্লায়েন্টদের মতামত';
      case 'social_proof': return 'কেন আমাদের বিশ্বাস করবেন';
      case 'faq': return 'সচরাচর জিজ্ঞাসিত প্রশ্ন';
      case 'contact_form': return 'যোগাযোগ করুন';
    }
  };

  const getDefaultContent = (type: SectionType): Record<string, any> => {
    switch (type) {
      case 'text':
        return { heading: '', body: '' };
      case 'image_gallery':
        return { images: [] };
      case 'service_card':
        return { services: [{ name: '', description: '', price: '', image: '', category: '' }] };
      case 'product_catalog':
        return { products: [{ name: '', description: '', price: '', image: '', category: '', originalPrice: '' }] };
      case 'product_gallery':
        return { products: [{ name: '', price: '', image: '', description: '' }] };
      case 'video':
        return { video_url: '', video_type: 'youtube' };
      case 'testimonial':
        return { testimonials: [{ name: '', role: '', company: '', content: '', rating: 5, avatar: '' }] };
      case 'social_proof':
        return { badges: [{ icon: 'verified', text: 'ভেরিফাইড বিজনেস', color: 'blue' }] };
      case 'faq':
        return { faqs: [{ question: '', answer: '' }] };
      case 'contact_form':
        return { form_title: 'যোগাযোগ করুন', form_description: 'আমাদের মেসেজ পাঠান, আমরা শীঘ্রই উত্তর দেব।' };
    }
  };

  const updateSection = useCallback(async (id: string, updates: Partial<CustomSection>) => {
    // Update local state immediately
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    
    // Show saving indicator
    setSaveStatus('saving');
    
    // Debounce the database update
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('vcard_custom_sections')
          .update(updates)
          .eq('id', id);

        if (error) {
          setSaveStatus('error');
          toast({ title: 'সেভ করতে সমস্যা হয়েছে', variant: 'destructive' });
        } else {
          setSaveStatus('saved');
        }
      } catch (err) {
        setSaveStatus('error');
      }
    }, 500);
  }, [toast]);

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from('vcard_custom_sections')
      .delete()
      .eq('id', id);

    if (!error) {
      setSections(sections.filter(s => s.id !== id));
      toast({ title: 'সেকশন মুছে ফেলা হয়েছে' });
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    const updates = sections.map((section, index) => ({
      id: section.id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('vcard_custom_sections')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    toast({ title: 'ক্রম সংরক্ষিত হয়েছে' });
    setSaving(false);
  };

  // Auto-save indicator component
  const SaveIndicator = () => {
    if (saveStatus === 'idle') return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-center gap-2 text-sm"
      >
        {saveStatus === 'saving' && (
          <>
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">সেভ হচ্ছে...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <Check size={14} className="text-green-500" />
            <span className="text-green-600">সেভ হয়েছে</span>
          </>
        )}
        {saveStatus === 'error' && (
          <span className="text-destructive">সেভ ব্যর্থ</span>
        )}
      </motion.div>
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">কাস্টম সেকশন</h2>
          <p className="text-sm text-muted-foreground">
            আপনার ল্যান্ডিং পেজে কাস্টম কন্টেন্ট যোগ করুন
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Auto-save indicator */}
          <AnimatePresence>
            <SaveIndicator />
          </AnimatePresence>
          
          {sections.length > 1 && (
            <Button variant="outline" size="sm" onClick={saveOrder} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              <span className="hidden sm:inline">ক্রম সেভ করুন</span>
              <span className="sm:hidden">সেভ</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" disabled={adding}>
                {adding ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                <span className="hidden sm:inline">সেকশন যোগ করুন</span>
                <span className="sm:hidden">যোগ</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {sectionTypes.map((item) => (
                <DropdownMenuItem
                  key={item.type}
                  onClick={() => addSection(item.type)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="bg-muted/30 rounded-xl p-6 sm:p-8 text-center border border-dashed border-border">
          <Plus size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">এখনো কোনো কাস্টম সেকশন নেই</p>
          <p className="text-sm text-muted-foreground mb-4">টেক্সট, ছবি, সার্ভিস বা প্রোডাক্ট যোগ করুন</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" disabled={adding}>
                {adding ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                প্রথম সেকশন যোগ করুন
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64">
              {sectionTypes.map((item) => (
                <DropdownMenuItem
                  key={item.type}
                  onClick={() => addSection(item.type)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
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
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onUpdate={updateSection}
                  onDelete={deleteSection}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

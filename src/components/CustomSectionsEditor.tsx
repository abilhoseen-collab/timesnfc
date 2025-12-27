import { useState, useEffect, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Type,
  Image as ImageIcon,
  CreditCard,
  Loader2,
  Save,
} from 'lucide-react';
import { SortableSection } from './SortableSection';

export type SectionType = 'text' | 'image_gallery' | 'service_card';

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

const sectionTypes = [
  { type: 'text' as SectionType, icon: Type, label: 'Text Section', description: 'Headings, paragraphs, and formatted text' },
  { type: 'image_gallery' as SectionType, icon: ImageIcon, label: 'Image Gallery', description: 'Photo galleries and image carousels' },
  { type: 'service_card' as SectionType, icon: CreditCard, label: 'Service Card', description: 'Services or products with pricing' },
];

export default function CustomSectionsEditor({ vcardId }: CustomSectionsEditorProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (vcardId) {
      fetchSections();
    }
  }, [vcardId]);

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
    const defaultContent = getDefaultContent(type);
    const newSortOrder = sections.length;

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
      toast({ title: 'Failed to add section', variant: 'destructive' });
    } else if (data) {
      setSections([...sections, data as CustomSection]);
      toast({ title: 'Section added' });
    }
    setShowAddMenu(false);
  };

  const getDefaultTitle = (type: SectionType): string => {
    switch (type) {
      case 'text': return 'About Me';
      case 'image_gallery': return 'Gallery';
      case 'service_card': return 'Services';
    }
  };

  const getDefaultContent = (type: SectionType): Record<string, any> => {
    switch (type) {
      case 'text':
        return { heading: '', body: '' };
      case 'image_gallery':
        return { images: [] };
      case 'service_card':
        return { services: [{ name: '', description: '', price: '' }] };
    }
  };

  const updateSection = async (id: string, updates: Partial<CustomSection>) => {
    const { error } = await supabase
      .from('vcard_custom_sections')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from('vcard_custom_sections')
      .delete()
      .eq('id', id);

    if (!error) {
      setSections(sections.filter(s => s.id !== id));
      toast({ title: 'Section deleted' });
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

    toast({ title: 'Order saved' });
    setSaving(false);
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
          <h2 className="text-lg font-bold text-foreground">Custom Sections</h2>
          <p className="text-sm text-muted-foreground">
            Add and arrange custom content on your landing page
          </p>
        </div>
        <div className="flex gap-2">
          {sections.length > 1 && (
            <Button variant="outline" size="sm" onClick={saveOrder} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Save Order
            </Button>
          )}
          <div className="relative">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              <Plus size={16} className="mr-2" />
              Add Section
            </Button>
            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  {sectionTypes.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => addSection(item.type)}
                      className="w-full p-4 flex items-start gap-3 hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="bg-muted/30 rounded-xl p-8 text-center border border-dashed border-border">
          <Plus size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No custom sections yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add text, images, or service cards to your landing page</p>
          <Button variant="secondary" size="sm" onClick={() => setShowAddMenu(true)}>
            <Plus size={16} className="mr-2" />
            Add Your First Section
          </Button>
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
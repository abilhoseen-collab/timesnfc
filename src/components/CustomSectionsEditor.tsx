import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { SortableSection } from './SortableSection';

export type SectionType = 'text' | 'image_gallery' | 'service_card' | 'video';

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
  { type: 'video' as SectionType, icon: Video, label: 'Video Embed', description: 'YouTube, Vimeo, or other video embeds' },
];

export default function CustomSectionsEditor({ vcardId }: CustomSectionsEditorProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

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
        toast({ title: 'Failed to add section', description: error.message, variant: 'destructive' });
      } else if (data) {
        setSections(prev => [...prev, data as CustomSection]);
        toast({ title: 'Section added successfully' });
      }
    } catch (err) {
      console.error('Error adding section:', err);
      toast({ title: 'Failed to add section', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const getDefaultTitle = (type: SectionType): string => {
    switch (type) {
      case 'text': return 'About Me';
      case 'image_gallery': return 'Gallery';
      case 'service_card': return 'Services';
      case 'video': return 'Video';
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
      case 'video':
        return { video_url: '', video_type: 'youtube' };
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" disabled={adding}>
                {adding ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                Add Section
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
        <div className="bg-muted/30 rounded-xl p-8 text-center border border-dashed border-border">
          <Plus size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No custom sections yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add text, images, or service cards to your landing page</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" disabled={adding}>
                {adding ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                Add Your First Section
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
import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
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
  rectSortingStrategy,
  useSortable as useSortableItem,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  Type,
  Image as ImageIcon,
  CreditCard,
  Plus,
  X,
  Loader2,
  Upload,
  Move,
  Video,
} from 'lucide-react';
import type { CustomSection, SectionType } from './CustomSectionsEditor';

interface SortableSectionProps {
  section: CustomSection;
  onUpdate: (id: string, updates: Partial<CustomSection>) => void;
  onDelete: (id: string) => void;
}

interface SortableImageProps {
  id: string;
  url: string;
  index: number;
  onRemove: (index: number) => void;
}

function SortableImage({ id, url, index, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortableItem({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-lg overflow-hidden group ${
        isDragging ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
    >
      <img src={url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-white/90 text-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <Move size={12} />
      </button>
      <button
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export function SortableSection({ section, onUpdate, onDelete }: SortableSectionProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
  };

  const getIcon = (type: SectionType) => {
    switch (type) {
      case 'text': return Type;
      case 'image_gallery': return ImageIcon;
      case 'service_card': return CreditCard;
      case 'video': return Video;
    }
  };

  const Icon = getIcon(section.section_type);

  const handleContentChange = (key: string, value: any) => {
    onUpdate(section.id, { 
      content: { ...section.content, [key]: value } 
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const newImages: string[] = [...(section.content.images || [])];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Max 5MB per image', variant: 'destructive' });
        continue;
      }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `sections/${section.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      } catch (error: any) {
        toast({ title: 'Upload failed', variant: 'destructive' });
      }
    }

    handleContentChange('images', newImages);
    setUploadingImage(false);
  };

  const removeImage = (index: number) => {
    const images = [...(section.content.images || [])];
    images.splice(index, 1);
    handleContentChange('images', images);
  };

  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const images = [...(section.content.images || [])];
      const oldIndex = images.findIndex((_, i) => `img-${i}` === active.id);
      const newIndex = images.findIndex((_, i) => `img-${i}` === over.id);
      const reordered = arrayMove(images, oldIndex, newIndex);
      handleContentChange('images', reordered);
    }
  };

  const addService = () => {
    const services = [...(section.content.services || [])];
    services.push({ name: '', description: '', price: '' });
    handleContentChange('services', services);
  };

  const updateService = (index: number, field: string, value: string) => {
    const services = [...(section.content.services || [])];
    services[index] = { ...services[index], [field]: value };
    handleContentChange('services', services);
  };

  const removeService = (index: number) => {
    const services = [...(section.content.services || [])];
    services.splice(index, 1);
    handleContentChange('services', services);
  };

  // Helper function to parse video URLs and generate embed
  const getVideoEmbed = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
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
    
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        Invalid video URL. Please use YouTube, Vimeo, or direct video links.
      </div>
    );
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-xl border border-border overflow-hidden ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
      layout
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/30">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
        >
          <GripVertical size={20} className="text-muted-foreground" />
        </button>
        
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>

        <Input
          value={section.title || ''}
          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
          placeholder="Section title"
          className="flex-1 bg-transparent border-0 font-medium focus-visible:ring-0 px-0"
        />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUpdate(section.id, { is_visible: !section.is_visible })}
            className="h-8 w-8"
          >
            {section.is_visible ? (
              <Eye size={16} className="text-muted-foreground" />
            ) : (
              <EyeOff size={16} className="text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8"
          >
            {isExpanded ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(section.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Text Section */}
              {section.section_type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Heading</label>
                    <Input
                      value={section.content.heading || ''}
                      onChange={(e) => handleContentChange('heading', e.target.value)}
                      placeholder="Enter heading..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Body Text</label>
                    <Textarea
                      value={section.content.body || ''}
                      onChange={(e) => handleContentChange('body', e.target.value)}
                      placeholder="Enter your text content..."
                      rows={4}
                    />
                  </div>
                </>
              )}

              {/* Image Gallery */}
              {section.section_type === 'image_gallery' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Images <span className="text-muted-foreground font-normal">(drag to reorder)</span>
                  </label>
                  <DndContext
                    sensors={imageSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleImageDragEnd}
                  >
                    <SortableContext
                      items={(section.content.images || []).map((_: string, i: number) => `img-${i}`)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {(section.content.images || []).map((url: string, index: number) => (
                          <SortableImage
                            key={`img-${index}`}
                            id={`img-${index}`}
                            url={url}
                            index={index}
                            onRemove={removeImage}
                          />
                        ))}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors"
                        >
                          {uploadingImage ? (
                            <Loader2 size={20} className="animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Upload size={20} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Upload</span>
                            </>
                          )}
                        </button>
                      </div>
                    </SortableContext>
                  </DndContext>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">Max 5MB per image. Drag images to reorder.</p>
                </div>
              )}

              {/* Service Cards */}
              {section.section_type === 'service_card' && (
                <div className="space-y-4">
                  {(section.content.services || []).map((service: any, index: number) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Service {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(index)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <Input
                        value={service.name || ''}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        placeholder="Service name"
                      />
                      <Textarea
                        value={service.description || ''}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        placeholder="Description"
                        rows={2}
                      />
                      <Input
                        value={service.price || ''}
                        onChange={(e) => updateService(index, 'price', e.target.value)}
                        placeholder="Price (e.g., ৳500 or From ৳1000)"
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addService} className="w-full">
                    <Plus size={16} className="mr-2" />
                    Add Service
                  </Button>
                </div>
              )}

              {/* Video Embed */}
              {section.section_type === 'video' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Video URL</label>
                    <Input
                      value={section.content.video_url || ''}
                      onChange={(e) => handleContentChange('video_url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports YouTube, Vimeo, and direct video links
                    </p>
                  </div>
                  
                  {section.content.video_url && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      {getVideoEmbed(section.content.video_url)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
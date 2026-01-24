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
  Quote,
  Star,
  Camera,
  ShoppingBag,
  Award,
  HelpCircle,
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [uploadingServiceImage, setUploadingServiceImage] = useState<number | null>(null);
  const [uploadingTestimonialAvatar, setUploadingTestimonialAvatar] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const serviceImageRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const testimonialAvatarRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
      case 'product_catalog': return ShoppingBag;
      case 'video': return Video;
      case 'testimonial': return Quote;
      case 'social_proof': return Award;
      case 'faq': return HelpCircle;
      case 'contact_form': return Type;
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
    services.push({ name: '', description: '', price: '', image: '', category: '' });
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

  // Upload service image
  const handleServiceImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }

    setUploadingServiceImage(index);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `services/${section.id}/${Date.now()}-${index}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      updateService(index, 'image', publicUrl);
      toast({ title: 'Image uploaded!' });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingServiceImage(null);
    }
  };

  // Testimonial functions
  const addTestimonial = () => {
    const testimonials = [...(section.content.testimonials || [])];
    testimonials.push({ name: '', role: '', company: '', content: '', rating: 5, avatar: '' });
    handleContentChange('testimonials', testimonials);
  };

  const updateTestimonial = (index: number, field: string, value: string | number) => {
    const testimonials = [...(section.content.testimonials || [])];
    testimonials[index] = { ...testimonials[index], [field]: value };
    handleContentChange('testimonials', testimonials);
  };

  const removeTestimonial = (index: number) => {
    const testimonials = [...(section.content.testimonials || [])];
    testimonials.splice(index, 1);
    handleContentChange('testimonials', testimonials);
  };

  // Upload testimonial avatar
  const handleTestimonialAvatarUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }

    setUploadingTestimonialAvatar(index);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `testimonials/${section.id}/${Date.now()}-${index}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      updateTestimonial(index, 'avatar', publicUrl);
      toast({ title: 'Avatar uploaded!' });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingTestimonialAvatar(null);
    }
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

              {/* Service Cards with Image Upload */}
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
                      
                      {/* Service Image */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0">
                          {service.image ? (
                            <img src={service.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={20} className="text-muted-foreground" />
                            </div>
                          )}
                          {uploadingServiceImage === index && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 size={16} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            ref={(el) => { serviceImageRefs.current[index] = el; }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleServiceImageUpload(index, e)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => serviceImageRefs.current[index]?.click()}
                            disabled={uploadingServiceImage === index}
                          >
                            <Camera size={14} className="mr-2" />
                            {service.image ? 'Change Image' : 'Add Image'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">Optional product/service photo</p>
                        </div>
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
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={service.price || ''}
                          onChange={(e) => updateService(index, 'price', e.target.value)}
                          placeholder="Price (e.g., ৳500)"
                        />
                        <Input
                          value={service.category || ''}
                          onChange={(e) => updateService(index, 'category', e.target.value)}
                          placeholder="Category (optional)"
                        />
                      </div>
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

              {/* Testimonials Section */}
              {section.section_type === 'testimonial' && (
                <div className="space-y-4">
                  {(section.content.testimonials || []).map((testimonial: any, index: number) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Review {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTestimonial(index)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      {/* Avatar & Rating */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                          {testimonial.avatar ? (
                            <img src={testimonial.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                              {testimonial.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          {uploadingTestimonialAvatar === index && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 size={14} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            ref={(el) => { testimonialAvatarRefs.current[index] = el; }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleTestimonialAvatarUpload(index, e)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => testimonialAvatarRefs.current[index]?.click()}
                            disabled={uploadingTestimonialAvatar === index}
                          >
                            <Camera size={14} className="mr-1" />
                            Avatar
                          </Button>
                        </div>
                        
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => updateTestimonial(index, 'rating', star)}
                              className="p-0.5"
                            >
                              <Star
                                size={18}
                                className={star <= (testimonial.rating || 5) 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={testimonial.name || ''}
                          onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                          placeholder="Client Name"
                        />
                        <Input
                          value={testimonial.role || ''}
                          onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                          placeholder="Role/Title"
                        />
                      </div>
                      <Input
                        value={testimonial.company || ''}
                        onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                        placeholder="Company (optional)"
                      />
                      <Textarea
                        value={testimonial.content || ''}
                        onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                        placeholder="Write the review/testimonial..."
                        rows={3}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTestimonial} className="w-full">
                    <Plus size={16} className="mr-2" />
                    Add Testimonial
                  </Button>
                </div>
              )}

              {/* Product Catalog with Image Upload */}
              {section.section_type === 'product_catalog' && (
                <div className="space-y-4">
                  {(section.content.products || []).map((product: any, index: number) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Product {index + 1}</span>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const products = [...(section.content.products || [])];
                          products.splice(index, 1);
                          handleContentChange('products', products);
                        }} className="h-7 w-7 text-destructive">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      {/* Product Image */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={20} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
                                return;
                              }
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `products/${section.id}/${Date.now()}-${index}.${fileExt}`;
                                const { error: uploadError } = await supabase.storage.from('profile-photos').upload(fileName, file);
                                if (uploadError) throw uploadError;
                                const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
                                const products = [...(section.content.products || [])];
                                products[index] = { ...products[index], image: publicUrl };
                                handleContentChange('products', products);
                                toast({ title: 'Image uploaded!' });
                              } catch (err) {
                                toast({ title: 'Upload failed', variant: 'destructive' });
                              }
                            }}
                            className="hidden"
                            id={`product-image-${section.id}-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`product-image-${section.id}-${index}`)?.click()}
                          >
                            <Camera size={14} className="mr-2" />
                            {product.image ? 'Change Image' : 'Add Image'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">Product photo (optional)</p>
                        </div>
                      </div>
                      
                      <Input value={product.name || ''} onChange={(e) => {
                        const products = [...(section.content.products || [])];
                        products[index] = { ...products[index], name: e.target.value };
                        handleContentChange('products', products);
                      }} placeholder="Product name" />
                      <Textarea value={product.description || ''} onChange={(e) => {
                        const products = [...(section.content.products || [])];
                        products[index] = { ...products[index], description: e.target.value };
                        handleContentChange('products', products);
                      }} placeholder="Description" rows={2} />
                      <div className="grid grid-cols-3 gap-3">
                        <Input value={product.price || ''} onChange={(e) => {
                          const products = [...(section.content.products || [])];
                          products[index] = { ...products[index], price: e.target.value };
                          handleContentChange('products', products);
                        }} placeholder="৳500" />
                        <Input value={product.originalPrice || ''} onChange={(e) => {
                          const products = [...(section.content.products || [])];
                          products[index] = { ...products[index], originalPrice: e.target.value };
                          handleContentChange('products', products);
                        }} placeholder="৳800 (original)" />
                        <Input value={product.category || ''} onChange={(e) => {
                          const products = [...(section.content.products || [])];
                          products[index] = { ...products[index], category: e.target.value };
                          handleContentChange('products', products);
                        }} placeholder="Category" />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const products = [...(section.content.products || [])];
                    products.push({ name: '', description: '', price: '', image: '', category: '', originalPrice: '' });
                    handleContentChange('products', products);
                  }} className="w-full"><Plus size={16} className="mr-2" />Add Product</Button>
                </div>
              )}

              {/* Social Proof Badges */}
              {section.section_type === 'social_proof' && (
                <div className="space-y-4">
                  {(section.content.badges || []).map((badge: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border flex gap-3 items-center">
                      <Input value={badge.text || ''} onChange={(e) => {
                        const badges = [...(section.content.badges || [])];
                        badges[index] = { ...badges[index], text: e.target.value };
                        handleContentChange('badges', badges);
                      }} placeholder="Verified Business" className="flex-1" />
                      <Button variant="ghost" size="icon" onClick={() => {
                        const badges = [...(section.content.badges || [])];
                        badges.splice(index, 1);
                        handleContentChange('badges', badges);
                      }} className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const badges = [...(section.content.badges || [])];
                    badges.push({ icon: 'verified', text: '', color: 'blue' });
                    handleContentChange('badges', badges);
                  }} className="w-full"><Plus size={16} className="mr-2" />Add Badge</Button>
                </div>
              )}

              {/* FAQ Section */}
              {section.section_type === 'faq' && (
                <div className="space-y-4">
                  {(section.content.faqs || []).map((faq: any, index: number) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">FAQ {index + 1}</span>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const faqs = [...(section.content.faqs || [])];
                          faqs.splice(index, 1);
                          handleContentChange('faqs', faqs);
                        }} className="h-7 w-7 text-destructive"><Trash2 size={14} /></Button>
                      </div>
                      <Input value={faq.question || ''} onChange={(e) => {
                        const faqs = [...(section.content.faqs || [])];
                        faqs[index] = { ...faqs[index], question: e.target.value };
                        handleContentChange('faqs', faqs);
                      }} placeholder="Question?" />
                      <Textarea value={faq.answer || ''} onChange={(e) => {
                        const faqs = [...(section.content.faqs || [])];
                        faqs[index] = { ...faqs[index], answer: e.target.value };
                        handleContentChange('faqs', faqs);
                      }} placeholder="Answer..." rows={3} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const faqs = [...(section.content.faqs || [])];
                    faqs.push({ question: '', answer: '' });
                    handleContentChange('faqs', faqs);
                  }} className="w-full"><Plus size={16} className="mr-2" />Add FAQ</Button>
                </div>
              )}

              {/* Contact Form Settings */}
              {section.section_type === 'contact_form' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Form Title</label>
                    <Input
                      value={section.content.form_title || ''}
                      onChange={(e) => handleContentChange('form_title', e.target.value)}
                      placeholder="Get in Touch"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Form Description</label>
                    <Textarea
                      value={section.content.form_description || ''}
                      onChange={(e) => handleContentChange('form_description', e.target.value)}
                      placeholder="Send us a message and we'll get back to you soon."
                      rows={2}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Visitors can send you messages directly. You'll receive notifications via email.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
import { useState, useRef, useEffect, useCallback } from 'react';
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
import { uploadOptimizedImage, ImagePresets } from '@/lib/imageOptimizer';
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
  MessageSquare,
  Images,
  ZoomIn,
} from 'lucide-react';
import type { CustomSection, SectionType } from './CustomSectionsEditor';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  onPreview: (url: string) => void;
}

// Debounced input component for smooth typing
interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}

function DebouncedInput({ value, onChange, placeholder, className, type = 'text' }: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <Input
      type={type}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

// Debounced textarea component
interface DebouncedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

function DebouncedTextarea({ value, onChange, placeholder, rows = 3, className }: DebouncedTextareaProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <Textarea
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      rows={rows}
      className={`resize-none ${className || ''}`}
    />
  );
}

function SortableImage({ id, url, index, onRemove, onPreview }: SortableImageProps) {
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
        onClick={(e) => {
          e.stopPropagation();
          onPreview(url);
        }}
        className="absolute bottom-2 left-2 p-1.5 bg-white/90 text-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ZoomIn size={12} />
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
  const [uploadingProductImage, setUploadingProductImage] = useState<number | null>(null);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const serviceImageRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const testimonialAvatarRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const productImageRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const galleryImageRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const imageSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
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
      case 'product_gallery': return Images;
      case 'video': return Video;
      case 'testimonial': return Quote;
      case 'social_proof': return Award;
      case 'faq': return HelpCircle;
      case 'contact_form': return MessageSquare;
    }
  };

  const Icon = getIcon(section.section_type);

  const handleContentChange = useCallback((key: string, value: any) => {
    onUpdate(section.id, { 
      content: { ...section.content, [key]: value } 
    });
  }, [section.id, section.content, onUpdate]);

  const handleTitleChange = useCallback((title: string) => {
    onUpdate(section.id, { title });
  }, [section.id, onUpdate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const newImages: string[] = [...(section.content.images || [])];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'ফাইল খুব বড়', description: 'সর্বোচ্চ 10MB', variant: 'destructive' });
        continue;
      }

      try {
        const base = `sections/${section.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { publicUrl } = await uploadOptimizedImage(file, 'profile-photos', base, ImagePresets.cover);
        newImages.push(publicUrl);
      } catch (error: any) {
        toast({ title: 'আপলোড ব্যর্থ হয়েছে', variant: 'destructive' });
      }
    }

    handleContentChange('images', newImages);
    setUploadingImage(false);
    if (e.target) e.target.value = '';
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

  // Service functions
  const updateService = useCallback((index: number, field: string, value: string) => {
    const services = [...(section.content.services || [])];
    services[index] = { ...services[index], [field]: value };
    handleContentChange('services', services);
  }, [section.content.services, handleContentChange]);

  const addService = () => {
    const services = [...(section.content.services || [])];
    services.push({ name: '', description: '', price: '', image: '', category: '' });
    handleContentChange('services', services);
  };

  const removeService = (index: number) => {
    const services = [...(section.content.services || [])];
    services.splice(index, 1);
    handleContentChange('services', services);
  };

  const handleServiceImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'ভুল ফাইল টাইপ', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'ফাইল খুব বড়', description: 'সর্বোচ্চ 10MB', variant: 'destructive' });
      return;
    }

    setUploadingServiceImage(index);
    try {
      const base = `services/${section.id}/${Date.now()}-${index}`;
      const { publicUrl } = await uploadOptimizedImage(file, 'profile-photos', base, ImagePresets.cover);
      updateService(index, 'image', publicUrl);
      toast({ title: 'ছবি আপলোড হয়েছে!' });
    } catch (error) {
      toast({ title: 'আপলোড ব্যর্থ', variant: 'destructive' });
    } finally {
      setUploadingServiceImage(null);
      if (e.target) e.target.value = '';
    }
  };

  // Testimonial functions
  const updateTestimonial = useCallback((index: number, field: string, value: string | number) => {
    const testimonials = [...(section.content.testimonials || [])];
    testimonials[index] = { ...testimonials[index], [field]: value };
    handleContentChange('testimonials', testimonials);
  }, [section.content.testimonials, handleContentChange]);

  const addTestimonial = () => {
    const testimonials = [...(section.content.testimonials || [])];
    testimonials.push({ name: '', role: '', company: '', content: '', rating: 5, avatar: '' });
    handleContentChange('testimonials', testimonials);
  };

  const removeTestimonial = (index: number) => {
    const testimonials = [...(section.content.testimonials || [])];
    testimonials.splice(index, 1);
    handleContentChange('testimonials', testimonials);
  };

  const handleTestimonialAvatarUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'ভুল ফাইল টাইপ', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'ফাইল খুব বড়', description: 'সর্বোচ্চ 5MB', variant: 'destructive' });
      return;
    }

    setUploadingTestimonialAvatar(index);
    try {
      const base = `testimonials/${section.id}/${Date.now()}-${index}`;
      const { publicUrl } = await uploadOptimizedImage(file, 'profile-photos', base, ImagePresets.avatar);
      updateTestimonial(index, 'avatar', publicUrl);
      toast({ title: 'অ্যাভাটার আপলোড হয়েছে!' });
    } catch (error) {
      toast({ title: 'আপলোড ব্যর্থ', variant: 'destructive' });
    } finally {
      setUploadingTestimonialAvatar(null);
      if (e.target) e.target.value = '';
    }
  };

  // Product functions
  const updateProduct = useCallback((index: number, field: string, value: string) => {
    const products = [...(section.content.products || [])];
    products[index] = { ...products[index], [field]: value };
    handleContentChange('products', products);
  }, [section.content.products, handleContentChange]);

  const addProduct = () => {
    const products = [...(section.content.products || [])];
    products.push({ name: '', description: '', price: '', image: '', category: '', originalPrice: '' });
    handleContentChange('products', products);
  };

  const removeProduct = (index: number) => {
    const products = [...(section.content.products || [])];
    products.splice(index, 1);
    handleContentChange('products', products);
  };

  const handleProductImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'ফাইল খুব বড়', description: 'সর্বোচ্চ 10MB', variant: 'destructive' });
      return;
    }

    setUploadingProductImage(index);
    try {
      const base = `products/${section.id}/${Date.now()}-${index}`;
      const { publicUrl } = await uploadOptimizedImage(file, 'profile-photos', base, ImagePresets.cover);
      updateProduct(index, 'image', publicUrl);
      toast({ title: 'ছবি আপলোড হয়েছে!' });
    } catch (err) {
      toast({ title: 'আপলোড ব্যর্থ', variant: 'destructive' });
    } finally {
      setUploadingProductImage(null);
      if (e.target) e.target.value = '';
    }
  };

  // Gallery product functions
  const addGalleryProduct = () => {
    const products = [...(section.content.products || [])];
    products.push({ name: '', price: '', image: '', description: '' });
    handleContentChange('products', products);
  };

  const handleGalleryImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'ফাইল খুব বড়', description: 'সর্বোচ্চ 10MB', variant: 'destructive' });
      return;
    }

    setUploadingGalleryImage(index);
    try {
      const base = `gallery/${section.id}/${Date.now()}-${index}`;
      const { publicUrl } = await uploadOptimizedImage(file, 'profile-photos', base, ImagePresets.cover);
      updateProduct(index, 'image', publicUrl);
      toast({ title: 'ছবি আপলোড হয়েছে!' });
    } catch (err) {
      toast({ title: 'আপলোড ব্যর্থ', variant: 'destructive' });
    } finally {
      setUploadingGalleryImage(null);
      if (e.target) e.target.value = '';
    }
  };

  // Badge functions
  const updateBadge = useCallback((index: number, field: string, value: string) => {
    const badges = [...(section.content.badges || [])];
    badges[index] = { ...badges[index], [field]: value };
    handleContentChange('badges', badges);
  }, [section.content.badges, handleContentChange]);

  const addBadge = () => {
    const badges = [...(section.content.badges || [])];
    badges.push({ icon: 'verified', text: '', color: 'blue' });
    handleContentChange('badges', badges);
  };

  const removeBadge = (index: number) => {
    const badges = [...(section.content.badges || [])];
    badges.splice(index, 1);
    handleContentChange('badges', badges);
  };

  // FAQ functions
  const updateFAQ = useCallback((index: number, field: string, value: string) => {
    const faqs = [...(section.content.faqs || [])];
    faqs[index] = { ...faqs[index], [field]: value };
    handleContentChange('faqs', faqs);
  }, [section.content.faqs, handleContentChange]);

  const addFAQ = () => {
    const faqs = [...(section.content.faqs || [])];
    faqs.push({ question: '', answer: '' });
    handleContentChange('faqs', faqs);
  };

  const removeFAQ = (index: number) => {
    const faqs = [...(section.content.faqs || [])];
    faqs.splice(index, 1);
    handleContentChange('faqs', faqs);
  };

  // Video embed helper
  const getVideoEmbed = (url: string) => {
    if (!url) return null;
    
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
    
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <video controls className="w-full h-full">
          <source src={url} />
        </video>
      );
    }
    
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
        Invalid video URL. YouTube, Vimeo বা সরাসরি ভিডিও লিঙ্ক ব্যবহার করুন।
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
      <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2 sm:gap-3 bg-muted/30">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none flex-shrink-0"
        >
          <GripVertical size={18} className="text-muted-foreground" />
        </button>
        
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-primary sm:w-4 sm:h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <DebouncedInput
            value={section.title || ''}
            onChange={handleTitleChange}
            placeholder="সেকশন টাইটেল"
            className="bg-transparent border-0 font-medium focus-visible:ring-1 focus-visible:ring-primary/50 px-2 text-sm sm:text-base"
          />
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUpdate(section.id, { is_visible: !section.is_visible })}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            {section.is_visible ? (
              <Eye size={14} className="text-muted-foreground sm:w-4 sm:h-4" />
            ) : (
              <EyeOff size={14} className="text-muted-foreground sm:w-4 sm:h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            {isExpanded ? (
              <ChevronUp size={14} className="text-muted-foreground sm:w-4 sm:h-4" />
            ) : (
              <ChevronDown size={14} className="text-muted-foreground sm:w-4 sm:h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(section.id)}
            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
          >
            <Trash2 size={14} className="sm:w-4 sm:h-4" />
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
            <div className="p-3 sm:p-4 space-y-4">
              {/* Text Section */}
              {section.section_type === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">হেডিং</label>
                    <DebouncedInput
                      value={section.content.heading || ''}
                      onChange={(val) => handleContentChange('heading', val)}
                      placeholder="হেডিং লিখুন..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">বডি টেক্সট</label>
                    <DebouncedTextarea
                      value={section.content.body || ''}
                      onChange={(val) => handleContentChange('body', val)}
                      placeholder="আপনার টেক্সট কন্টেন্ট লিখুন..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Image Gallery */}
              {section.section_type === 'image_gallery' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    ছবি <span className="text-muted-foreground font-normal">(ক্রম পরিবর্তনে ড্র্যাগ করুন)</span>
                  </label>
                  
                  {/* Drag & Drop Zone */}
                  <div
                    ref={dropZoneRef}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOver(false);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOver(false);
                      
                      const files = e.dataTransfer.files;
                      if (!files || files.length === 0) return;
                      
                      setUploadingImage(true);
                      const newImages: string[] = [...(section.content.images || [])];
                      
                      for (const file of Array.from(files)) {
                        if (!file.type.startsWith('image/')) continue;
                        if (file.size > 5 * 1024 * 1024) {
                          toast({ title: 'ফাইল খুব বড়', description: 'সর্বোচ্চ 5MB', variant: 'destructive' });
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
                          toast({ title: 'আপলোড ব্যর্থ হয়েছে', variant: 'destructive' });
                        }
                      }
                      
                      handleContentChange('images', newImages);
                      setUploadingImage(false);
                      toast({ title: `${newImages.length - (section.content.images || []).length} টি ছবি যোগ হয়েছে!` });
                    }}
                    className={`p-4 rounded-lg border-2 border-dashed transition-all ${
                      isDragOver 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <DndContext
                      sensors={imageSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleImageDragEnd}
                    >
                      <SortableContext
                        items={(section.content.images || []).map((_: string, i: number) => `img-${i}`)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-3">
                          {(section.content.images || []).map((url: string, index: number) => (
                            <SortableImage
                              key={`img-${index}`}
                              id={`img-${index}`}
                              url={url}
                              index={index}
                              onRemove={removeImage}
                              onPreview={(url) => setLightboxImage(url)}
                            />
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            disabled={uploadingImage}
                            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors min-h-[80px] cursor-pointer bg-muted/30"
                          >
                            {uploadingImage ? (
                              <Loader2 size={20} className="animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload size={18} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">আপলোড</span>
                              </>
                            )}
                          </button>
                        </div>
                      </SortableContext>
                    </DndContext>
                    
                    {/* Drag & Drop hint */}
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">
                        📂 ছবি এখানে ড্র্যাগ করে ছেড়ে দিন অথবা ক্লিক করে আপলোড করুন
                      </p>
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">সর্বোচ্চ 5MB প্রতি ছবি। একাধিক ছবি একসাথে ড্র্যাগ করুন।</p>
                  
                  {/* Lightbox Modal */}
                  <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
                    <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
                      <div className="relative w-full h-[80vh] flex items-center justify-center">
                        {lightboxImage && (
                          <img 
                            src={lightboxImage} 
                            alt="Preview" 
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
                        <button
                          onClick={() => setLightboxImage(null)}
                          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Service Cards */}
              {section.section_type === 'service_card' && (
                <div className="space-y-4">
                  {(section.content.services || []).map((service: any, index: number) => (
                    <div key={index} className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">সার্ভিস {index + 1}</span>
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0">
                          {service.image ? (
                            <img src={service.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={18} className="text-muted-foreground" />
                            </div>
                          )}
                          {uploadingServiceImage === index && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 size={14} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
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
                            className="w-full sm:w-auto"
                          >
                            <Camera size={14} className="mr-2" />
                            {service.image ? 'ছবি পরিবর্তন' : 'ছবি যোগ করুন'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">ঐচ্ছিক</p>
                        </div>
                      </div>
                      
                      <DebouncedInput
                        value={service.name || ''}
                        onChange={(val) => updateService(index, 'name', val)}
                        placeholder="সার্ভিসের নাম"
                      />
                      <DebouncedTextarea
                        value={service.description || ''}
                        onChange={(val) => updateService(index, 'description', val)}
                        placeholder="বিবরণ"
                        rows={2}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DebouncedInput
                          value={service.price || ''}
                          onChange={(val) => updateService(index, 'price', val)}
                          placeholder="মূল্য (যেমন: ৳500)"
                        />
                        <DebouncedInput
                          value={service.category || ''}
                          onChange={(val) => updateService(index, 'category', val)}
                          placeholder="ক্যাটাগরি (ঐচ্ছিক)"
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addService} className="w-full">
                    <Plus size={16} className="mr-2" />
                    সার্ভিস যোগ করুন
                  </Button>
                </div>
              )}

              {/* Video Embed */}
              {section.section_type === 'video' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">ভিডিও URL</label>
                    <DebouncedInput
                      value={section.content.video_url || ''}
                      onChange={(val) => handleContentChange('video_url', val)}
                      placeholder="https://www.youtube.com/watch?v=... বা https://vimeo.com/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      YouTube, Vimeo এবং সরাসরি ভিডিও লিঙ্ক সাপোর্টেড
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
                    <div key={index} className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">রিভিউ {index + 1}</span>
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                            {testimonial.avatar ? (
                              <img src={testimonial.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-base sm:text-lg font-bold">
                                {testimonial.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                            {uploadingTestimonialAvatar === index && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 size={12} className="animate-spin text-white" />
                              </div>
                            )}
                          </div>
                          <div>
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
                              <Camera size={12} className="mr-1" />
                              ছবি
                            </Button>
                          </div>
                        </div>
                        
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => updateTestimonial(index, 'rating', star)}
                              className="p-0.5 touch-manipulation"
                            >
                              <Star
                                size={20}
                                className={star <= (testimonial.rating || 5) 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-muted-foreground/30'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DebouncedInput
                          value={testimonial.name || ''}
                          onChange={(val) => updateTestimonial(index, 'name', val)}
                          placeholder="ক্লায়েন্টের নাম"
                        />
                        <DebouncedInput
                          value={testimonial.role || ''}
                          onChange={(val) => updateTestimonial(index, 'role', val)}
                          placeholder="পদবী/টাইটেল"
                        />
                      </div>
                      <DebouncedInput
                        value={testimonial.company || ''}
                        onChange={(val) => updateTestimonial(index, 'company', val)}
                        placeholder="কোম্পানি (ঐচ্ছিক)"
                      />
                      <DebouncedTextarea
                        value={testimonial.content || ''}
                        onChange={(val) => updateTestimonial(index, 'content', val)}
                        placeholder="রিভিউ/টেস্টিমোনিয়াল লিখুন..."
                        rows={3}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTestimonial} className="w-full">
                    <Plus size={16} className="mr-2" />
                    টেস্টিমোনিয়াল যোগ করুন
                  </Button>
                </div>
              )}

              {/* Product Catalog */}
              {section.section_type === 'product_catalog' && (
                <div className="space-y-4">
                  {(section.content.products || []).map((product: any, index: number) => (
                    <div key={index} className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">প্রোডাক্ট {index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeProduct(index)} 
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      {/* Product Image */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={18} className="text-muted-foreground" />
                            </div>
                          )}
                          {uploadingProductImage === index && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 size={14} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            ref={(el) => { productImageRefs.current[index] = el; }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleProductImageUpload(index, e)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => productImageRefs.current[index]?.click()}
                            disabled={uploadingProductImage === index}
                            className="w-full sm:w-auto"
                          >
                            <Camera size={14} className="mr-2" />
                            {product.image ? 'ছবি পরিবর্তন' : 'ছবি যোগ করুন'}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">প্রোডাক্টের ছবি (ঐচ্ছিক)</p>
                        </div>
                      </div>
                      
                      <DebouncedInput 
                        value={product.name || ''} 
                        onChange={(val) => updateProduct(index, 'name', val)}
                        placeholder="প্রোডাক্টের নাম" 
                      />
                      <DebouncedTextarea 
                        value={product.description || ''} 
                        onChange={(val) => updateProduct(index, 'description', val)}
                        placeholder="বিবরণ" 
                        rows={2}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <DebouncedInput 
                          value={product.price || ''} 
                          onChange={(val) => updateProduct(index, 'price', val)}
                          placeholder="৳500" 
                        />
                        <DebouncedInput 
                          value={product.originalPrice || ''} 
                          onChange={(val) => updateProduct(index, 'originalPrice', val)}
                          placeholder="৳800 (পূর্বমূল্য)" 
                        />
                        <DebouncedInput 
                          value={product.category || ''} 
                          onChange={(val) => updateProduct(index, 'category', val)}
                          placeholder="ক্যাটাগরি" 
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProduct} className="w-full">
                    <Plus size={16} className="mr-2" />
                    প্রোডাক্ট যোগ করুন
                  </Button>
                </div>
              )}

              {/* Social Proof Badges */}
              {section.section_type === 'social_proof' && (
                <div className="space-y-4">
                  {(section.content.badges || []).map((badge: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border flex gap-3 items-center">
                      <DebouncedInput 
                        value={badge.text || ''} 
                        onChange={(val) => updateBadge(index, 'text', val)}
                        placeholder="ভেরিফাইড বিজনেস" 
                        className="flex-1" 
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeBadge(index)}
                        className="h-8 w-8 text-destructive flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addBadge} className="w-full">
                    <Plus size={16} className="mr-2" />
                    ব্যাজ যোগ করুন
                  </Button>
                </div>
              )}

              {/* FAQ Section */}
              {section.section_type === 'faq' && (
                <div className="space-y-4">
                  {(section.content.faqs || []).map((faq: any, index: number) => (
                    <div key={index} className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">FAQ {index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFAQ(index)} 
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <DebouncedInput 
                        value={faq.question || ''} 
                        onChange={(val) => updateFAQ(index, 'question', val)}
                        placeholder="প্রশ্ন?" 
                      />
                      <DebouncedTextarea 
                        value={faq.answer || ''} 
                        onChange={(val) => updateFAQ(index, 'answer', val)}
                        placeholder="উত্তর..." 
                        rows={3}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addFAQ} className="w-full">
                    <Plus size={16} className="mr-2" />
                    FAQ যোগ করুন
                  </Button>
                </div>
              )}

              {/* Contact Form Settings */}
              {section.section_type === 'contact_form' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">ফর্ম টাইটেল</label>
                    <DebouncedInput
                      value={section.content.form_title || ''}
                      onChange={(val) => handleContentChange('form_title', val)}
                      placeholder="যোগাযোগ করুন"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">ফর্ম বিবরণ</label>
                    <DebouncedTextarea
                      value={section.content.form_description || ''}
                      onChange={(val) => handleContentChange('form_description', val)}
                      placeholder="আমাদের মেসেজ পাঠান, আমরা শীঘ্রই উত্তর দেব।"
                      rows={2}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ভিজিটররা সরাসরি মেসেজ পাঠাতে পারবে। আপনি ইমেইলে নোটিফিকেশন পাবেন।
                  </p>
                </div>
              )}

              {/* Product Gallery */}
              {section.section_type === 'product_gallery' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    ছবিসহ প্রোডাক্ট যোগ করুন। এগুলো সুন্দর গ্রিড গ্যালারিতে লাইটবক্স জুম সহ প্রদর্শিত হবে।
                  </p>
                  {(section.content.products || []).map((product: any, index: number) => (
                    <div key={index} className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">প্রোডাক্ট {index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeProduct(index)} 
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      {/* Product Image */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={18} className="text-muted-foreground" />
                            </div>
                          )}
                          {uploadingGalleryImage === index && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 size={14} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            ref={(el) => { galleryImageRefs.current[index] = el; }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleGalleryImageUpload(index, e)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => galleryImageRefs.current[index]?.click()}
                            disabled={uploadingGalleryImage === index}
                            className="w-full sm:w-auto"
                          >
                            <Camera size={14} className="mr-2" />
                            {product.image ? 'পরিবর্তন' : 'ছবি যোগ করুন'}
                          </Button>
                        </div>
                      </div>
                      
                      <DebouncedInput 
                        value={product.name || ''} 
                        onChange={(val) => updateProduct(index, 'name', val)}
                        placeholder="প্রোডাক্টের নাম" 
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DebouncedInput 
                          value={product.price || ''} 
                          onChange={(val) => updateProduct(index, 'price', val)}
                          placeholder="মূল্য (যেমন: ৳500)" 
                        />
                        <DebouncedInput 
                          value={product.description || ''} 
                          onChange={(val) => updateProduct(index, 'description', val)}
                          placeholder="সংক্ষিপ্ত বিবরণ" 
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addGalleryProduct} className="w-full">
                    <Plus size={16} className="mr-2" />
                    প্রোডাক্ট যোগ করুন
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

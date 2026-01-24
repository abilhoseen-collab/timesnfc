import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
  Edit,
  Eye,
  EyeOff,
  Plus,
  X,
  Layout,
  Star,
  Users,
  Layers,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Type,
  Phone,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import ImageUploader from './ImageUploader';

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

interface Props {
  section: LandingPageSection;
  userId: string;
  onUpdate: (updates: Partial<LandingPageSection>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragHandleProps?: Record<string, any>;
}

const sectionIcons: Record<string, any> = {
  hero: Layout,
  features: Star,
  about: Users,
  services: Layers,
  testimonials: MessageSquare,
  gallery: ImageIcon,
  video: Video,
  text: Type,
  contact: Phone,
  faq: FileText,
  cta: ExternalLink,
};

export default function LandingPageSectionEditor({
  section,
  userId,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  dragHandleProps,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(section.content);

  const Icon = sectionIcons[section.section_type] || Layout;

  const handleContentChange = (key: string, value: any) => {
    const newContent = { ...content, [key]: value };
    setContent(newContent);
    onUpdate({ content: newContent });
  };

  const handleItemChange = (itemsKey: string, index: number, field: string, value: any) => {
    const items = [...(content[itemsKey] || [])];
    items[index] = { ...items[index], [field]: value };
    handleContentChange(itemsKey, items);
  };

  const addItem = (itemsKey: string, defaultItem: Record<string, any>) => {
    const items = [...(content[itemsKey] || []), defaultItem];
    handleContentChange(itemsKey, items);
  };

  const removeItem = (itemsKey: string, index: number) => {
    const items = (content[itemsKey] || []).filter((_: any, i: number) => i !== index);
    handleContentChange(itemsKey, items);
  };

  const renderContentEditor = () => {
    switch (section.section_type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input
                value={content.headline || ''}
                onChange={(e) => handleContentChange('headline', e.target.value)}
                placeholder="Main headline"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Subheadline</Label>
              <Textarea
                value={content.subheadline || ''}
                onChange={(e) => handleContentChange('subheadline', e.target.value)}
                placeholder="Supporting text"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={content.buttonText || ''}
                  onChange={(e) => handleContentChange('buttonText', e.target.value)}
                  placeholder="Get Started"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={content.buttonLink || ''}
                  onChange={(e) => handleContentChange('buttonLink', e.target.value)}
                  placeholder="#contact"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Background Image</Label>
              <div className="mt-1.5">
                <ImageUploader
                  value={content.backgroundImage || ''}
                  onChange={(url) => handleContentChange('backgroundImage', url)}
                  userId={userId}
                  folder="hero"
                  placeholder="Upload hero background"
                  aspectRatio="wide"
                />
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <Label>Features</Label>
            {(content.items || []).map((item: any, index: number) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Feature {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem('items', index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
                <Input
                  value={item.title || ''}
                  onChange={(e) => handleItemChange('items', index, 'title', e.target.value)}
                  placeholder="Feature title"
                />
                <Textarea
                  value={item.description || ''}
                  onChange={(e) => handleItemChange('items', index, 'description', e.target.value)}
                  placeholder="Feature description"
                  rows={2}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem('items', { title: '', description: '', icon: 'star' })}
            >
              <Plus size={14} className="mr-2" />
              Add Feature
            </Button>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="About Us"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="Tell your story..."
                rows={4}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Image</Label>
              <div className="mt-1.5">
                <ImageUploader
                  value={content.image || ''}
                  onChange={(url) => handleContentChange('image', url)}
                  userId={userId}
                  folder="about"
                  placeholder="Upload about image"
                  aspectRatio="wide"
                />
              </div>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-4">
            <Label>Services</Label>
            {(content.items || []).map((item: any, index: number) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Service {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem('items', index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
                <Input
                  value={item.title || ''}
                  onChange={(e) => handleItemChange('items', index, 'title', e.target.value)}
                  placeholder="Service title"
                />
                <Textarea
                  value={item.description || ''}
                  onChange={(e) => handleItemChange('items', index, 'description', e.target.value)}
                  placeholder="Service description"
                  rows={2}
                />
                <Input
                  value={item.price || ''}
                  onChange={(e) => handleItemChange('items', index, 'price', e.target.value)}
                  placeholder="Price (optional)"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem('items', { title: '', description: '', price: '' })}
            >
              <Plus size={14} className="mr-2" />
              Add Service
            </Button>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <Label>Testimonials</Label>
            {(content.items || []).map((item: any, index: number) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Testimonial {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem('items', index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={item.name || ''}
                    onChange={(e) => handleItemChange('items', index, 'name', e.target.value)}
                    placeholder="Customer name"
                  />
                  <Input
                    value={item.role || ''}
                    onChange={(e) => handleItemChange('items', index, 'role', e.target.value)}
                    placeholder="Role/Company"
                  />
                </div>
                <Textarea
                  value={item.content || ''}
                  onChange={(e) => handleItemChange('items', index, 'content', e.target.value)}
                  placeholder="Testimonial content"
                  rows={3}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem('items', { name: '', role: '', content: '' })}
            >
              <Plus size={14} className="mr-2" />
              Add Testimonial
            </Button>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <Label>Gallery Images</Label>
            {(content.images || []).map((url: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => {
                    const images = [...(content.images || [])];
                    images[index] = e.target.value;
                    handleContentChange('images', images);
                  }}
                  placeholder="Image URL"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const images = (content.images || []).filter((_: any, i: number) => i !== index);
                    handleContentChange('images', images);
                  }}
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleContentChange('images', [...(content.images || []), ''])}
            >
              <Plus size={14} className="mr-2" />
              Add Image
            </Button>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label>Video URL</Label>
              <Input
                value={content.videoUrl || ''}
                onChange={(e) => handleContentChange('videoUrl', e.target.value)}
                placeholder="YouTube or Vimeo URL"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Video Type</Label>
              <select
                value={content.videoType || 'youtube'}
                onChange={(e) => handleContentChange('videoType', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg"
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
              </select>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Heading</Label>
              <Input
                value={content.heading || ''}
                onChange={(e) => handleContentChange('heading', e.target.value)}
                placeholder="Section heading"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Body Text</Label>
              <Textarea
                value={content.body || ''}
                onChange={(e) => handleContentChange('body', e.target.value)}
                placeholder="Write your content..."
                rows={6}
                className="mt-1.5"
              />
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Contact Us"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={content.email || ''}
                  onChange={(e) => handleContentChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={content.phone || ''}
                  onChange={(e) => handleContentChange('phone', e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={content.address || ''}
                onChange={(e) => handleContentChange('address', e.target.value)}
                placeholder="Your business address"
                rows={2}
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showForm !== false}
                onCheckedChange={(checked) => handleContentChange('showForm', checked)}
              />
              <Label>Show Contact Form</Label>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
            <Label>FAQ Items</Label>
            {(content.items || []).map((item: any, index: number) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">FAQ {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem('items', index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
                <Input
                  value={item.question || ''}
                  onChange={(e) => handleItemChange('items', index, 'question', e.target.value)}
                  placeholder="Question?"
                />
                <Textarea
                  value={item.answer || ''}
                  onChange={(e) => handleItemChange('items', index, 'answer', e.target.value)}
                  placeholder="Answer"
                  rows={2}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem('items', { question: '', answer: '' })}
            >
              <Plus size={14} className="mr-2" />
              Add FAQ
            </Button>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={content.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Ready to Get Started?"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
                placeholder="Call to action description"
                rows={2}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={content.buttonText || ''}
                  onChange={(e) => handleContentChange('buttonText', e.target.value)}
                  placeholder="Sign Up Now"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={content.buttonLink || ''}
                  onChange={(e) => handleContentChange('buttonLink', e.target.value)}
                  placeholder="#signup"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">No editor available for this section type.</p>;
    }
  };

  return (
    <motion.div
      layout
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-3 p-4">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical size={20} className="text-muted-foreground" />
          </div>
          
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon size={20} className="text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <Input
              value={section.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="font-medium bg-transparent border-none p-0 h-auto focus:ring-0"
              placeholder="Section title"
            />
            <p className="text-xs text-muted-foreground capitalize">{section.section_type}</p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdate({ is_visible: !section.is_visible })}
              title={section.is_visible ? 'Hide section' : 'Show section'}
            >
              {section.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={!canMoveUp}
            >
              <ChevronUp size={16} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={!canMoveDown}
            >
              <ChevronDown size={16} />
            </Button>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <Edit size={16} />
              </Button>
            </CollapsibleTrigger>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-border">
            {renderContentEditor()}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

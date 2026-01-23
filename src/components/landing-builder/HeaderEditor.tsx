import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, GripVertical, Menu, Save } from 'lucide-react';
import ImageUploader from './ImageUploader';

interface NavItem {
  label: string;
  link: string;
}

interface HeaderSettings {
  header_logo_url: string | null;
  header_title: string | null;
  header_nav_items: NavItem[];
  header_sticky: boolean;
  header_show_cta: boolean;
  header_cta_text: string | null;
  header_cta_link: string | null;
}

interface Props {
  landingPageId: string;
  userId: string;
  initialSettings: HeaderSettings;
  onUpdate: (settings: Partial<HeaderSettings>) => void;
}

export default function HeaderEditor({
  landingPageId,
  userId,
  initialSettings,
  onUpdate,
}: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialSettings.header_logo_url || '');
  const [title, setTitle] = useState(initialSettings.header_title || '');
  const [navItems, setNavItems] = useState<NavItem[]>(
    Array.isArray(initialSettings.header_nav_items) 
      ? initialSettings.header_nav_items 
      : []
  );
  const [sticky, setSticky] = useState(initialSettings.header_sticky ?? true);
  const [showCta, setShowCta] = useState(initialSettings.header_show_cta ?? true);
  const [ctaText, setCtaText] = useState(initialSettings.header_cta_text || 'Contact Us');
  const [ctaLink, setCtaLink] = useState(initialSettings.header_cta_link || '#contact');

  const addNavItem = () => {
    setNavItems([...navItems, { label: 'New Link', link: '#' }]);
  };

  const updateNavItem = (index: number, field: 'label' | 'link', value: string) => {
    const updated = [...navItems];
    updated[index] = { ...updated[index], [field]: value };
    setNavItems(updated);
  };

  const removeNavItem = (index: number) => {
    setNavItems(navItems.filter((_, i) => i !== index));
  };

  const moveNavItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= navItems.length) return;

    const updated = [...navItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setNavItems(updated);
  };

  const saveHeader = async () => {
    setSaving(true);

    const navItemsJson = JSON.parse(JSON.stringify(navItems));

    const { error } = await supabase
      .from('landing_pages')
      .update({
        header_logo_url: logoUrl || null,
        header_title: title || null,
        header_nav_items: navItemsJson,
        header_sticky: sticky,
        header_show_cta: showCta,
        header_cta_text: ctaText || 'Contact Us',
        header_cta_link: ctaLink || '#contact',
      })
      .eq('id', landingPageId);

    if (error) {
      toast({ title: 'Failed to save header', variant: 'destructive' });
    } else {
      toast({ title: 'Header saved!' });
      onUpdate({
        header_logo_url: logoUrl || null,
        header_title: title || null,
        header_nav_items: navItems,
        header_sticky: sticky,
        header_show_cta: showCta,
        header_cta_text: ctaText || 'Contact Us',
        header_cta_link: ctaLink || '#contact',
      });
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Menu size={20} className="text-primary" />
          <h3 className="font-bold text-foreground">Header & Navigation</h3>
        </div>
        <Button onClick={saveHeader} disabled={saving} size="sm">
          <Save size={14} className="mr-2" />
          {saving ? 'Saving...' : 'Save Header'}
        </Button>
      </div>

      {/* Live Preview */}
      <div className="bg-muted rounded-xl p-4 overflow-hidden">
        <p className="text-xs text-muted-foreground mb-3">Preview:</p>
        <div 
          className="bg-card rounded-lg shadow-sm border border-border p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />
            ) : (
              <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {title?.charAt(0) || 'L'}
                </span>
              </div>
            )}
            <span className="font-bold text-foreground text-sm">{title || 'Site Title'}</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {navItems.slice(0, 4).map((item, i) => (
              <span key={i} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                {item.label}
              </span>
            ))}
            {navItems.length > 4 && (
              <span className="text-xs text-muted-foreground">+{navItems.length - 4} more</span>
            )}
          </div>
          {showCta && (
            <Button size="sm" className="ml-4">
              {ctaText || 'Contact Us'}
            </Button>
          )}
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <Label className="mb-2 block">Logo</Label>
        <ImageUploader
          value={logoUrl}
          onChange={setLogoUrl}
          userId={userId}
          folder="logos"
          placeholder="Upload your logo"
          aspectRatio="square"
        />
      </div>

      {/* Site Title */}
      <div>
        <Label htmlFor="header-title">Site Title</Label>
        <Input
          id="header-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your Business Name"
          className="mt-1.5"
        />
      </div>

      {/* Navigation Items */}
      <div>
        <Label className="mb-2 block">Navigation Links</Label>
        <div className="space-y-2">
          {navItems.map((item, index) => (
            <motion.div
              key={index}
              layout
              className="flex items-center gap-2 bg-muted/50 rounded-lg p-2"
            >
              <GripVertical size={16} className="text-muted-foreground cursor-grab" />
              <Input
                value={item.label}
                onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                placeholder="Link text"
                className="flex-1"
              />
              <Input
                value={item.link}
                onChange={(e) => updateNavItem(index, 'link', e.target.value)}
                placeholder="#section or /page"
                className="flex-1"
              />
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveNavItem(index, 'up')}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveNavItem(index, 'down')}
                  disabled={index === navItems.length - 1}
                  className="h-8 w-8 p-0"
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNavItem(index)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <X size={14} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addNavItem}
          className="mt-3"
        >
          <Plus size={14} className="mr-2" />
          Add Navigation Link
        </Button>
      </div>

      {/* Header Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Sticky Header</Label>
            <p className="text-xs text-muted-foreground">Header stays visible when scrolling</p>
          </div>
          <Switch checked={sticky} onCheckedChange={setSticky} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Show CTA Button</Label>
            <p className="text-xs text-muted-foreground">Display a call-to-action button</p>
          </div>
          <Switch checked={showCta} onCheckedChange={setShowCta} />
        </div>
      </div>

      {/* CTA Settings */}
      {showCta && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="cta-text">CTA Button Text</Label>
            <Input
              id="cta-text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Contact Us"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cta-link">CTA Button Link</Label>
            <Input
              id="cta-link"
              value={ctaLink}
              onChange={(e) => setCtaLink(e.target.value)}
              placeholder="#contact"
              className="mt-1.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}

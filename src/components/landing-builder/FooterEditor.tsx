import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialLink {
  platform: string;
  url: string;
}

interface AdditionalLink {
  label: string;
  url: string;
}

interface FooterSettings {
  footer_copyright_text: string;
  footer_social_links: SocialLink[];
  footer_additional_links: AdditionalLink[];
  footer_show_powered_by: boolean;
  footer_background_color: string | null;
}

interface FooterEditorProps {
  settings: FooterSettings;
  onUpdate: (updates: Partial<FooterSettings>) => void;
  saving?: boolean;
}

const socialPlatforms = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'location', label: 'Location', icon: MapPin },
];

const getSocialIcon = (platform: string) => {
  const found = socialPlatforms.find(p => p.value === platform);
  return found ? found.icon : Globe;
};

export default function FooterEditor({ settings, onUpdate, saving }: FooterEditorProps) {
  const { toast } = useToast();
  const [newSocialPlatform, setNewSocialPlatform] = useState('facebook');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const socialLinks = settings.footer_social_links || [];
  const additionalLinks = settings.footer_additional_links || [];

  const addSocialLink = () => {
    if (!newSocialUrl.trim()) {
      toast({ title: 'Please enter a URL', variant: 'destructive' });
      return;
    }
    const updated = [...socialLinks, { platform: newSocialPlatform, url: newSocialUrl }];
    onUpdate({ footer_social_links: updated });
    setNewSocialUrl('');
    toast({ title: 'Social link added' });
  };

  const removeSocialLink = (index: number) => {
    const updated = socialLinks.filter((_, i) => i !== index);
    onUpdate({ footer_social_links: updated });
  };

  const addAdditionalLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      toast({ title: 'Please enter both label and URL', variant: 'destructive' });
      return;
    }
    const updated = [...additionalLinks, { label: newLinkLabel, url: newLinkUrl }];
    onUpdate({ footer_additional_links: updated });
    setNewLinkLabel('');
    setNewLinkUrl('');
    toast({ title: 'Link added' });
  };

  const removeAdditionalLink = (index: number) => {
    const updated = additionalLinks.filter((_, i) => i !== index);
    onUpdate({ footer_additional_links: updated });
  };

  const updateAdditionalLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = additionalLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    onUpdate({ footer_additional_links: updated });
  };

  return (
    <div className="space-y-8">
      {/* Copyright Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          © Copyright Text
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="copyright">Copyright Notice</Label>
            <Textarea
              id="copyright"
              value={settings.footer_copyright_text || ''}
              onChange={(e) => onUpdate({ footer_copyright_text: e.target.value })}
              placeholder="© 2024 Your Company. All rights reserved."
              rows={2}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Appears at the bottom of your page
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="powered-by">Show "Powered by" badge</Label>
              <p className="text-xs text-muted-foreground">Display attribution in footer</p>
            </div>
            <Switch
              id="powered-by"
              checked={settings.footer_show_powered_by ?? true}
              onCheckedChange={(checked) => onUpdate({ footer_show_powered_by: checked })}
            />
          </div>
        </div>
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Globe size={20} className="text-primary" />
          Social Links
        </h3>
        
        {/* Existing Social Links */}
        {socialLinks.length > 0 && (
          <div className="space-y-3 mb-6">
            {socialLinks.map((link, index) => {
              const Icon = getSocialIcon(link.platform);
              const platformInfo = socialPlatforms.find(p => p.value === link.platform);
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{platformInfo?.label || link.platform}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocialLink(index)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add New Social Link */}
        <div className="space-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <Select value={newSocialPlatform} onValueChange={setNewSocialPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {socialPlatforms.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value}>
                    <div className="flex items-center gap-2">
                      <platform.icon size={14} />
                      <span>{platform.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newSocialUrl}
              onChange={(e) => setNewSocialUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button variant="outline" size="sm" onClick={addSocialLink} className="w-full">
            <Plus size={16} className="mr-2" />
            Add Social Link
          </Button>
        </div>
      </motion.div>

      {/* Additional Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <ExternalLink size={20} className="text-primary" />
          Additional Footer Links
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add links to Privacy Policy, Terms of Service, or other pages
        </p>
        
        {/* Existing Links */}
        {additionalLinks.length > 0 && (
          <div className="space-y-3 mb-6">
            {additionalLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    value={link.label}
                    onChange={(e) => updateAdditionalLink(index, 'label', e.target.value)}
                    placeholder="Link text"
                    className="bg-background"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateAdditionalLink(index, 'url', e.target.value)}
                    placeholder="URL"
                    className="bg-background"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAdditionalLink(index)}
                  className="shrink-0 text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Link */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              placeholder="Link text (e.g., Privacy Policy)"
            />
            <Input
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="URL (e.g., /privacy)"
            />
          </div>
          <Button variant="outline" size="sm" onClick={addAdditionalLink} className="w-full">
            <Plus size={16} className="mr-2" />
            Add Link
          </Button>
        </div>
      </motion.div>

      {/* Footer Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <h3 className="text-lg font-bold text-foreground mb-4">Preview</h3>
        <div className="bg-muted/50 rounded-lg p-6">
          {/* Social Links Preview */}
          {socialLinks.length > 0 && (
            <div className="flex justify-center gap-4 mb-4">
              {socialLinks.map((link, index) => {
                const Icon = getSocialIcon(link.platform);
                return (
                  <div key={index} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Additional Links Preview */}
          {additionalLinks.length > 0 && (
            <div className="flex justify-center gap-4 mb-4 flex-wrap">
              {additionalLinks.map((link, index) => (
                <span key={index} className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                  {link.label}
                </span>
              ))}
            </div>
          )}
          
          {/* Copyright Preview */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {settings.footer_copyright_text || '© 2024 All rights reserved.'}
            </p>
            {settings.footer_show_powered_by && (
              <p className="text-xs text-muted-foreground mt-2">
                Powered by Times Digital
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {saving && (
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 size={16} className="animate-spin mr-2" />
          <span className="text-sm">Saving changes...</span>
        </div>
      )}
    </div>
  );
}

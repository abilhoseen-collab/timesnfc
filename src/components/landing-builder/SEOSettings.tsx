import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Globe,
  Image as ImageIcon,
  FileText,
  Save,
  Eye,
  Loader2,
} from 'lucide-react';

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  favicon_url: string | null;
  custom_domain: string | null;
}

interface Props {
  landingPage: LandingPage;
  onUpdate: (updates: Partial<LandingPage>) => void;
}

export default function SEOSettings({ landingPage, onUpdate }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [metaTitle, setMetaTitle] = useState(landingPage.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(landingPage.meta_description || '');
  const [ogImageUrl, setOgImageUrl] = useState(landingPage.og_image_url || '');
  const [faviconUrl, setFaviconUrl] = useState(landingPage.favicon_url || '');

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('landing_pages')
      .update({
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        og_image_url: ogImageUrl || null,
        favicon_url: faviconUrl || null,
      })
      .eq('id', landingPage.id);

    if (error) {
      toast({ title: 'Failed to save SEO settings', variant: 'destructive' });
    } else {
      onUpdate({
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        og_image_url: ogImageUrl || null,
        favicon_url: faviconUrl || null,
      });
      toast({ title: 'SEO settings saved!' });
    }
    setSaving(false);
  };

  const getPreviewUrl = () => {
    if (landingPage.custom_domain) {
      return `https://${landingPage.custom_domain}`;
    }
    return `${window.location.origin}/site/${landingPage.slug}`;
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Meta Tags */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Search Engine Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Optimize how your page appears in search results
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="meta-title">Meta Title</Label>
            <Input
              id="meta-title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={landingPage.name}
              className="mt-1.5"
              maxLength={60}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Recommended: Under 60 characters
              </p>
              <p className={`text-xs ${metaTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {metaTitle.length}/60
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="meta-description">Meta Description</Label>
            <Textarea
              id="meta-description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Describe your page in 155 characters or less..."
              className="mt-1.5"
              rows={3}
              maxLength={160}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Recommended: Under 160 characters
              </p>
              <p className={`text-xs ${metaDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {metaDescription.length}/160
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Preview */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Eye size={18} />
          Google Search Preview
        </h3>
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-green-700 mb-1 truncate">
            {getPreviewUrl()}
          </p>
          <h4 className="text-xl text-blue-700 hover:underline cursor-pointer mb-1">
            {metaTitle || landingPage.name}
          </h4>
          <p className="text-sm text-gray-600 line-clamp-2">
            {metaDescription || 'Add a meta description to see how your page will appear in search results.'}
          </p>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Globe size={24} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Social Media Preview</h3>
            <p className="text-sm text-muted-foreground">
              Control how your page looks when shared on social media
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="og-image">Open Graph Image URL</Label>
            <Input
              id="og-image"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://example.com/og-image.jpg"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended size: 1200 x 630 pixels
            </p>
          </div>

          {ogImageUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Preview:</p>
              <div className="border border-border rounded-lg overflow-hidden max-w-md">
                <img
                  src={ogImageUrl}
                  alt="OG Preview"
                  className="w-full h-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="p-3 bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase">
                    {landingPage.custom_domain || 'timesnfc.lovable.app'}
                  </p>
                  <p className="font-semibold text-gray-900 truncate">
                    {metaTitle || landingPage.name}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {metaDescription || 'No description'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Favicon */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <ImageIcon size={24} className="text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Favicon</h3>
            <p className="text-sm text-muted-foreground">
              The small icon shown in browser tabs
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="favicon">Favicon URL</Label>
            <Input
              id="favicon"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://example.com/favicon.ico"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 32x32 or 16x16 pixels, .ico or .png format
            </p>
          </div>

          {faviconUrl && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-foreground">Preview:</p>
              <img
                src={faviconUrl}
                alt="Favicon"
                className="w-8 h-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} className="mr-2" />
            Save SEO Settings
          </>
        )}
      </Button>
    </div>
  );
}

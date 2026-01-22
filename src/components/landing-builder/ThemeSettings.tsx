import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Palette,
  Type,
  Save,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';

interface LandingPage {
  id: string;
  theme_color: string;
  font_family: string;
  background_color: string;
  text_color: string;
}

interface Props {
  landingPage: LandingPage;
  onUpdate: (updates: Partial<LandingPage>) => void;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter', style: 'font-sans' },
  { value: 'Roboto', label: 'Roboto', style: 'font-sans' },
  { value: 'Open Sans', label: 'Open Sans', style: 'font-sans' },
  { value: 'Lato', label: 'Lato', style: 'font-sans' },
  { value: 'Poppins', label: 'Poppins', style: 'font-sans' },
  { value: 'Montserrat', label: 'Montserrat', style: 'font-sans' },
  { value: 'Playfair Display', label: 'Playfair Display', style: 'font-serif' },
  { value: 'Merriweather', label: 'Merriweather', style: 'font-serif' },
  { value: 'Georgia', label: 'Georgia', style: 'font-serif' },
  { value: 'Fira Code', label: 'Fira Code', style: 'font-mono' },
];

const colorPresets = [
  { name: 'Teal', primary: '#14b8a6', background: '#ffffff', text: '#1f2937' },
  { name: 'Blue', primary: '#3b82f6', background: '#ffffff', text: '#1f2937' },
  { name: 'Purple', primary: '#8b5cf6', background: '#ffffff', text: '#1f2937' },
  { name: 'Pink', primary: '#ec4899', background: '#ffffff', text: '#1f2937' },
  { name: 'Orange', primary: '#f97316', background: '#ffffff', text: '#1f2937' },
  { name: 'Green', primary: '#22c55e', background: '#ffffff', text: '#1f2937' },
  { name: 'Dark', primary: '#6366f1', background: '#0f172a', text: '#f8fafc' },
  { name: 'Warm Dark', primary: '#f59e0b', background: '#18181b', text: '#fafafa' },
];

export default function ThemeSettings({ landingPage, onUpdate }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [themeColor, setThemeColor] = useState(landingPage.theme_color);
  const [fontFamily, setFontFamily] = useState(landingPage.font_family);
  const [backgroundColor, setBackgroundColor] = useState(landingPage.background_color);
  const [textColor, setTextColor] = useState(landingPage.text_color);

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('landing_pages')
      .update({
        theme_color: themeColor,
        font_family: fontFamily,
        background_color: backgroundColor,
        text_color: textColor,
      })
      .eq('id', landingPage.id);

    if (error) {
      toast({ title: 'Failed to save theme settings', variant: 'destructive' });
    } else {
      onUpdate({
        theme_color: themeColor,
        font_family: fontFamily,
        background_color: backgroundColor,
        text_color: textColor,
      });
      toast({ title: 'Theme settings saved!' });
    }
    setSaving(false);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setThemeColor(preset.primary);
    setBackgroundColor(preset.background);
    setTextColor(preset.text);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Color Presets */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Color Presets</h3>
            <p className="text-sm text-muted-foreground">
              Quick start with pre-designed color schemes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {colorPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-xl border border-border hover:border-primary transition-colors text-center"
              style={{ backgroundColor: preset.background }}
            >
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2"
                style={{ backgroundColor: preset.primary }}
              />
              <p className="text-xs font-medium" style={{ color: preset.text }}>
                {preset.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Custom Colors</h3>
        
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <Label>Primary Color</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <Label>Background Color</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <Label>Text Color</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Type size={24} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Typography</h3>
            <p className="text-sm text-muted-foreground">
              Choose the font family for your landing page
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fontOptions.map((font) => (
            <button
              key={font.value}
              onClick={() => setFontFamily(font.value)}
              className={`p-4 rounded-xl border transition-colors text-left ${
                fontFamily === font.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p
                className="text-lg font-medium text-foreground mb-1"
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </p>
              <p
                className="text-sm text-muted-foreground"
                style={{ fontFamily: font.value }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Live Preview</h3>
        <div
          className="p-8 rounded-xl"
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
            fontFamily: fontFamily,
          }}
        >
          <h1 className="text-2xl font-bold mb-2">
            Welcome to Your Landing Page
          </h1>
          <p className="text-base mb-4 opacity-80">
            This is how your text will look with the current theme settings.
          </p>
          <button
            className="px-6 py-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: themeColor }}
          >
            Call to Action
          </button>
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
            Save Theme Settings
          </>
        )}
      </Button>
    </div>
  );
}

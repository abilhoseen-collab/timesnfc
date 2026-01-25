import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, Upload, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormData } from './types';

interface QRCodeSettingsProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
  userId: string | undefined;
}

export default function QRCodeSettings({ formData, onChange, userId }: QRCodeSettingsProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { toast } = useToast();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2MB', variant: 'destructive' });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('qr-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('qr-logos')
        .getPublicUrl(fileName);

      onChange('qr_logo_url', publicUrl);
      toast({ title: 'Logo uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <QrCode size={20} className="text-primary" />
        QR Code Customization
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Foreground Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.qr_foreground_color}
              onChange={(e) => onChange('qr_foreground_color', e.target.value)}
              className="w-12 h-12 rounded-lg border border-border cursor-pointer"
            />
            <Input
              value={formData.qr_foreground_color}
              onChange={(e) => onChange('qr_foreground_color', e.target.value)}
              className="bg-background flex-1"
              placeholder="#000000"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Background Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.qr_background_color}
              onChange={(e) => onChange('qr_background_color', e.target.value)}
              className="w-12 h-12 rounded-lg border border-border cursor-pointer"
            />
            <Input
              value={formData.qr_background_color}
              onChange={(e) => onChange('qr_background_color', e.target.value)}
              className="bg-background flex-1"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Center Logo (Optional)
          </label>
          <div className="flex items-center gap-4">
            {formData.qr_logo_url ? (
              <div className="relative">
                <img 
                  src={formData.qr_logo_url} 
                  alt="QR Logo" 
                  className="w-16 h-16 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={() => onChange('qr_logo_url', '')}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ) : null}
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Upload size={16} className="mr-2" />
              )}
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Square image recommended. Max 2MB. Will appear in center of QR code.
          </p>
        </div>
      </div>
    </div>
  );
}

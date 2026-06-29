import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, User, Loader2, Layout, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormData } from './types';
import { optimizeImage, ImagePresets, formatBytes } from '@/lib/imageOptimizer';

interface PhotoUploaderProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
  userId: string | undefined;
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function PhotoUploader({ formData, onChange, userId }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const { toast } = useToast();

  const handleEnhance = async () => {
    if (!formData.photo_url || !userId) return;
    setEnhancing(true);
    try {
      const base64 = await urlToBase64(formData.photo_url);
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No enhanced image returned');

      // Upload data URL → storage
      const blobRes = await fetch(data.imageUrl);
      const blob = await blobRes.blob();
      const fileName = `${userId}/enhanced-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from('profile-photos').upload(fileName, blob, {
        contentType: 'image/png',
      });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
      onChange('photo_url', publicUrl);
      toast({ title: 'ছবি উন্নত হয়েছে ✨', description: 'AI দিয়ে ছবির কোয়ালিটি বাড়ানো হয়েছে' });
    } catch (e: any) {
      toast({ title: 'AI Enhancement ব্যর্থ', description: e.message || 'আবার চেষ্টা করুন', variant: 'destructive' });
    } finally {
      setEnhancing(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    // 10MB hard cap on the *input* — we'll re-encode to ~50-200KB
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 10MB', variant: 'destructive' });
      return;
    }

    setUploadingPhoto(true);
    try {
      // Optimize: resize to 800px max edge + WebP encode (fallback JPEG)
      const optimized = await optimizeImage(file, ImagePresets.avatar);
      const fileName = `${userId}/${Date.now()}.${optimized.ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, optimized.blob, {
          contentType: optimized.mime,
          cacheControl: '31536000', // 1y — filename is timestamped so cache-busts safely
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      onChange('photo_url', publicUrl);
      const saved = Math.round((1 - optimized.ratio) * 100);
      toast({
        title: 'ছবি অপ্টিমাইজ হয়েছে',
        description: `${formatBytes(optimized.originalSize)} → ${formatBytes(optimized.blob.size)} (${saved}% কম)`,
      });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 10MB', variant: 'destructive' });
      return;
    }

    setUploadingCover(true);
    try {
      const optimized = await optimizeImage(file, ImagePresets.cover);
      const fileName = `covers/${userId}/${Date.now()}.${optimized.ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, optimized.blob, {
          contentType: optimized.mime,
          cacheControl: '31536000',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      onChange('cover_image_url', publicUrl);
      const saved = Math.round((1 - optimized.ratio) * 100);
      toast({
        title: 'Cover image uploaded',
        description: `${formatBytes(optimized.originalSize)} → ${formatBytes(optimized.blob.size)} (${saved}% কম)`,
      });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <>
      {/* Profile Photo */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Camera size={20} className="text-primary" />
          Profile Photo
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
              {formData.photo_url ? (
                <img 
                  src={formData.photo_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-muted-foreground" />
              )}
            </div>
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto || enhancing}
            >
              <Camera size={16} className="mr-2" />
              {uploadingPhoto ? 'Uploading...' : formData.photo_url ? 'Change Photo' : 'Upload Photo'}
            </Button>
            {formData.photo_url && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleEnhance}
                disabled={enhancing || uploadingPhoto}
                className="ml-2"
              >
                {enhancing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                {enhancing ? 'Enhancing...' : 'AI Enhance ✨'}
              </Button>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG, WebP বা GIF। Max 10MB — auto-resize হয়ে WebP-তে কনভার্ট হবে।
            </p>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Layout size={20} className="text-primary" />
          Cover Image
        </h2>
        <div className="space-y-4">
          {formData.cover_image_url ? (
            <div className="relative aspect-[3/1] rounded-xl overflow-hidden bg-muted border border-border">
              <img 
                src={formData.cover_image_url} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[3/1] rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center">
              <div className="text-center">
                <Layout size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No cover image</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
            >
              <Camera size={16} className="mr-2" />
              {uploadingCover ? 'Uploading...' : formData.cover_image_url ? 'Change Cover' : 'Upload Cover'}
            </Button>
            {formData.cover_image_url && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange('cover_image_url', '')}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended: 1200x400px। Max 10MB — auto-resize হয়ে WebP-তে কনভার্ট হবে।
          </p>
        </div>
      </div>
    </>
  );
}

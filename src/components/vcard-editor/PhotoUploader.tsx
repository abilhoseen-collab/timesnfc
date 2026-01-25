import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, User, Loader2, Layout } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormData } from './types';

interface PhotoUploaderProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
  userId: string | undefined;
}

export default function PhotoUploader({ formData, onChange, userId }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { toast } = useToast();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' });
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      onChange('photo_url', publicUrl);
      toast({ title: 'Photo uploaded', description: 'Your profile photo has been uploaded successfully' });
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

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' });
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `covers/${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      onChange('cover_image_url', publicUrl);
      toast({ title: 'Cover image uploaded successfully' });
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
              disabled={uploadingPhoto}
            >
              <Camera size={16} className="mr-2" />
              {uploadingPhoto ? 'Uploading...' : formData.photo_url ? 'Change Photo' : 'Upload Photo'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG or GIF. Max 5MB.
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
            Recommended size: 1200x400px. Max 5MB. This will appear as a banner at the top of your card.
          </p>
        </div>
      </div>
    </>
  );
}

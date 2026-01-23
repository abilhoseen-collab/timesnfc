import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, Image as ImageIcon, Link } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  userId: string;
  folder?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'wide' | 'tall';
}

export default function ImageUploader({
  value,
  onChange,
  userId,
  folder = 'images',
  placeholder = 'Upload an image or enter URL',
  aspectRatio = 'wide',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-page-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('landing-page-assets')
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast({ title: 'Image uploaded successfully!' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    tall: 'aspect-[3/4]',
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative group">
          <div className={`${aspectClasses[aspectRatio]} bg-muted rounded-lg overflow-hidden`}>
            <img
              src={value}
              alt="Uploaded"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} className="mr-1" />
              Replace
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X size={14} className="mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className={`${aspectClasses[aspectRatio]} bg-muted/50 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 size={32} className="text-muted-foreground animate-spin" />
          ) : (
            <>
              <ImageIcon size={32} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{placeholder}</p>
              <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          {uploading ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Upload size={14} className="mr-2" />
          )}
          Upload
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex-1"
        >
          <Link size={14} className="mr-2" />
          URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <Button size="sm" onClick={handleUrlSubmit}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

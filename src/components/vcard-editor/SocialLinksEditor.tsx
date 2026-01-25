import { Input } from '@/components/ui/input';
import { 
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Github,
} from 'lucide-react';
import { FormData } from './types';

interface SocialLinksEditorProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
}

export default function SocialLinksEditor({ formData, onChange }: SocialLinksEditorProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4">
        Social Links
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="relative">
          <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="LinkedIn URL"
            value={formData.linkedin_url}
            onChange={(e) => onChange('linkedin_url', e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="relative">
          <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Twitter URL"
            value={formData.twitter_url}
            onChange={(e) => onChange('twitter_url', e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="relative">
          <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Facebook URL"
            value={formData.facebook_url}
            onChange={(e) => onChange('facebook_url', e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="relative">
          <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Instagram URL"
            value={formData.instagram_url}
            onChange={(e) => onChange('instagram_url', e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="relative">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="YouTube URL"
            value={formData.youtube_url}
            onChange={(e) => onChange('youtube_url', e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="relative">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="GitHub URL"
            value={formData.github_url}
            onChange={(e) => onChange('github_url', e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>
    </div>
  );
}

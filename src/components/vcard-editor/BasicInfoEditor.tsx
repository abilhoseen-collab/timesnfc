import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Briefcase, 
  Building, 
  Mail, 
  Phone, 
  Globe,
  MapPin,
} from 'lucide-react';
import { FormData } from './types';

interface BasicInfoEditorProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
}

export default function BasicInfoEditor({ formData, onChange }: BasicInfoEditorProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <User size={20} className="text-primary" />
        Basic Information
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Full Name *
          </label>
          <Input
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="bg-background"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Job Title
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Senior Developer"
              value={formData.job_title}
              onChange={(e) => onChange('job_title', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Company
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Tech Solutions Inc."
              value={formData.company}
              onChange={(e) => onChange('company', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Phone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="+880 1XXX-XXXXXX"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => onChange('website', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input
              placeholder="123 Business Street, Dhaka, Bangladesh"
              value={formData.address}
              onChange={(e) => onChange('address', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Bio
          </label>
          <Textarea
            placeholder="A brief description about yourself or your business..."
            value={formData.bio}
            onChange={(e) => onChange('bio', e.target.value)}
            className="bg-background resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

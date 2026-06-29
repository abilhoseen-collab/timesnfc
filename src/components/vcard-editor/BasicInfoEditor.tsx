import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  User, Briefcase, Building, Mail, Phone, Globe, MapPin, Sparkles, Loader2,
} from 'lucide-react';
import { FormData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BasicInfoEditorProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string | boolean | number) => void;
}

export default function BasicInfoEditor({ formData, onChange }: BasicInfoEditorProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'creative'>('professional');
  const [aiLang, setAiLang] = useState<'bn' | 'en'>('bn');
  const { toast } = useToast();

  const generateBio = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-vcard-bio', {
        body: {
          name: formData.name,
          job_title: formData.job_title,
          company: formData.company,
          keywords: aiKeywords,
          tone: aiTone,
          language: aiLang,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.bio) {
        onChange('bio', data.bio);
        toast({ title: 'বায়ো তৈরি হয়েছে ✨' });
        setAiOpen(false);
      }
    } catch (e: any) {
      toast({
        title: 'AI তৈরিতে সমস্যা',
        description: e?.message || 'একটু পরে আবার চেষ্টা করুন।',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <User size={20} className="text-primary" />
        Basic Information
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Job Title</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input
              placeholder="CEO & Founder"
              value={formData.job_title}
              onChange={(e) => onChange('job_title', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Company</label>
          <div className="relative">
            <Building className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input
              placeholder="Acme Inc."
              value={formData.company}
              onChange={(e) => onChange('company', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input
              placeholder="+880 1234 567890"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChange={(e) => onChange('website', e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">Address</label>
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">Bio</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAiOpen(true)}
              className="gap-1.5 h-8 text-xs bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 hover:bg-primary/15"
            >
              <Sparkles size={14} className="text-primary" />
              AI দিয়ে লিখুন
            </Button>
          </div>
          <Textarea
            placeholder="A brief description about yourself or your business..."
            value={formData.bio}
            onChange={(e) => onChange('bio', e.target.value)}
            className="bg-background resize-none"
            rows={3}
          />
        </div>
      </div>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} /> AI Bio Generator
            </DialogTitle>
            <DialogDescription>
              আপনার পেশা ও বৈশিষ্ট্য অনুযায়ী AI একটি পেশাদার বায়ো তৈরি করে দেবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>কীওয়ার্ড / হাইলাইট</Label>
              <Textarea
                placeholder="যেমন: ১০ বছর অভিজ্ঞতা, ডিজিটাল মার্কেটিং বিশেষজ্ঞ, ৫০০+ ক্লায়েন্ট"
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                আপনার নাম ({formData.name || 'খালি'}), পেশা ({formData.job_title || 'খালি'}), কোম্পানি ({formData.company || 'খালি'}) ব্যবহার করা হবে।
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>টোন</Label>
                <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">পেশাদার</SelectItem>
                    <SelectItem value="friendly">বন্ধুত্বপূর্ণ</SelectItem>
                    <SelectItem value="creative">সৃজনশীল</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ভাষা</Label>
                <Select value={aiLang} onValueChange={(v: any) => setAiLang(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bn">বাংলা</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading}>
              বাতিল
            </Button>
            <Button onClick={generateBio} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Sparkles className="mr-2" size={16} />}
              {aiLoading ? 'তৈরি হচ্ছে...' : 'বায়ো তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

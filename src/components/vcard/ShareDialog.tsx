import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Facebook, Twitter, Linkedin, MessageCircle, Send, Mail, Copy, Check, QrCode,
} from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  name: string;
  ogImageUrl?: string;
}

export default function ShareDialog({ open, onOpenChange, url, name, ogImageUrl }: ShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const text = `${name}-এর ডিজিটাল বিজনেস কার্ড দেখুন:`;
  const encUrl = encodeURIComponent(url);
  const encText = encodeURIComponent(text);

  const channels = [
    { label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500 hover:bg-green-600', href: `https://wa.me/?text=${encText}%20${encUrl}` },
    { label: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700', href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}` },
    { label: 'Twitter / X', icon: Twitter, color: 'bg-slate-900 hover:bg-black', href: `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}` },
    { label: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700 hover:bg-blue-800', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}` },
    { label: 'Telegram', icon: Send, color: 'bg-sky-500 hover:bg-sky-600', href: `https://t.me/share/url?url=${encUrl}&text=${encText}` },
    { label: 'Email', icon: Mail, color: 'bg-gray-600 hover:bg-gray-700', href: `mailto:?subject=${encodeURIComponent(name)}&body=${encText}%20${encUrl}` },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: 'লিংক কপি হয়েছে!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
      } catch { /* user cancelled */ }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>শেয়ার করুন</DialogTitle>
        </DialogHeader>

        {ogImageUrl && (
          <div className="rounded-lg overflow-hidden border bg-muted">
            <img src={ogImageUrl} alt="Preview" className="w-full" loading="lazy" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 py-2">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center ${c.color}`}>
                <c.icon size={20} />
              </div>
              <span className="text-xs text-center">{c.label}</span>
            </a>
          ))}
        </div>

        <div className="flex gap-2">
          <Input value={url} readOnly className="flex-1" />
          <Button onClick={handleCopy} variant="outline">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button onClick={nativeShare} variant="secondary" className="w-full">
            <QrCode size={16} className="mr-2" />
            সিস্টেম শেয়ার মেনু
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Building2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Share2,
  Download,
  Eye,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface FormData {
  name: string;
  job_title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  bio: string;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  github_url: string;
  template: string;
  photo_url: string;
  cover_image_url: string;
  qr_foreground_color: string;
  qr_background_color: string;
  qr_logo_url: string;
  notification_email: string;
  notify_on_view: boolean;
  notify_on_click: boolean;
  slug: string;
  // Chat & Payment
  whatsapp_number?: string;
  telegram_username?: string;
  chat_enabled?: boolean;
  payment_enabled?: boolean;
  payment_bkash?: string;
  payment_nagad?: string;
  payment_rocket?: string;
  payment_bank_details?: string;
  payment_button_text?: string;
}

interface VCardPreviewProps {
  formData: FormData;
}

const templateStyles: Record<string, { bg: string; accent: string; card: string }> = {
  freelancer: { bg: 'bg-gradient-to-br from-slate-900 to-slate-800', accent: 'text-teal-400', card: 'bg-slate-800/50' },
  minimal: { bg: 'bg-white', accent: 'text-gray-900', card: 'bg-gray-50' },
  corporate: { bg: 'bg-gradient-to-br from-blue-900 to-indigo-900', accent: 'text-blue-300', card: 'bg-blue-800/30' },
  creative: { bg: 'bg-gradient-to-br from-purple-600 to-pink-500', accent: 'text-white', card: 'bg-white/10' },
  elegant: { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', accent: 'text-amber-700', card: 'bg-white' },
  modern: { bg: 'bg-gradient-to-br from-gray-900 to-black', accent: 'text-emerald-400', card: 'bg-gray-800/50' },
  tech: { bg: 'bg-gradient-to-br from-cyan-900 to-blue-900', accent: 'text-cyan-300', card: 'bg-cyan-900/30' },
  nature: { bg: 'bg-gradient-to-br from-green-800 to-emerald-900', accent: 'text-green-300', card: 'bg-green-800/30' },
  bold: { bg: 'bg-gradient-to-br from-red-600 to-orange-500', accent: 'text-white', card: 'bg-white/10' },
  classic: { bg: 'bg-gradient-to-br from-stone-100 to-stone-200', accent: 'text-stone-700', card: 'bg-white' },
  professional: { bg: 'bg-gradient-to-br from-slate-800 to-zinc-900', accent: 'text-amber-400', card: 'bg-slate-700/50' },
  vibrant: { bg: 'bg-gradient-to-br from-fuchsia-500 to-violet-600', accent: 'text-white', card: 'bg-white/15' },
};

export default function VCardPreview({ formData }: VCardPreviewProps) {
  const style = templateStyles[formData.template] || templateStyles.freelancer;
  const isLight = ['minimal', 'elegant', 'classic'].includes(formData.template);
  const textColor = isLight ? 'text-gray-900' : 'text-white';
  const mutedColor = isLight ? 'text-gray-600' : 'text-white/70';
  
  const socialLinks = [
    { url: formData.linkedin_url, icon: Linkedin, label: 'LinkedIn' },
    { url: formData.twitter_url, icon: Twitter, label: 'Twitter' },
    { url: formData.facebook_url, icon: Facebook, label: 'Facebook' },
    { url: formData.instagram_url, icon: Instagram, label: 'Instagram' },
    { url: formData.youtube_url, icon: Youtube, label: 'YouTube' },
    { url: formData.github_url, icon: Github, label: 'GitHub' },
  ].filter(link => link.url);

  const contactInfo = [
    { value: formData.email, icon: Mail, label: 'Email' },
    { value: formData.phone, icon: Phone, label: 'Phone' },
    { value: formData.website, icon: Globe, label: 'Website' },
    { value: formData.address, icon: MapPin, label: 'Address' },
  ].filter(item => item.value);

  return (
    <div className="sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={18} className="text-primary" />
        <h3 className="font-bold text-foreground">Live Preview</h3>
      </div>
      
      {/* Phone Frame */}
      <div className="relative mx-auto" style={{ width: '280px' }}>
        {/* Phone bezel */}
        <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] shadow-2xl" />
        
        {/* Screen */}
        <div className="relative m-2 rounded-[2rem] overflow-hidden bg-gray-900">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-20" />
          
          {/* Content */}
          <motion.div 
            key={formData.template}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${style.bg} min-h-[500px] overflow-y-auto`}
            style={{ maxHeight: '580px' }}
          >
            {/* Cover Image */}
            <div className="h-24 relative overflow-hidden">
              {formData.cover_image_url ? (
                <img 
                  src={formData.cover_image_url} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />
              )}
            </div>
            
            {/* Profile Section */}
            <div className="px-4 -mt-10 relative z-10">
              {/* Avatar */}
              <div className={`w-20 h-20 rounded-full border-4 ${isLight ? 'border-white bg-gray-100' : 'border-gray-800 bg-gray-700'} overflow-hidden mx-auto shadow-lg`}>
                {formData.photo_url ? (
                  <img 
                    src={formData.photo_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={`text-2xl font-bold ${style.accent}`}>
                      {formData.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name & Title */}
              <div className="text-center mt-3">
                <h1 className={`text-lg font-bold ${textColor}`}>
                  {formData.name || 'Your Name'}
                </h1>
                {(formData.job_title || formData.company) && (
                  <p className={`text-xs ${mutedColor} mt-0.5`}>
                    {formData.job_title}
                    {formData.job_title && formData.company && ' at '}
                    {formData.company}
                  </p>
                )}
              </div>
              
              {/* Bio */}
              {formData.bio && (
                <p className={`text-xs ${mutedColor} text-center mt-2 line-clamp-2`}>
                  {formData.bio}
                </p>
              )}
              
              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex justify-center gap-2 mt-3">
                  {socialLinks.slice(0, 4).map((link, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-full ${style.card} flex items-center justify-center ${style.accent}`}
                    >
                      <link.icon size={14} />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Contact Info */}
              <div className="mt-4 space-y-2">
                {contactInfo.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className={`${style.card} rounded-lg p-2 flex items-center gap-2`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${isLight ? 'bg-gray-100' : 'bg-white/10'} flex items-center justify-center`}>
                      <item.icon size={12} className={style.accent} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] ${mutedColor}`}>{item.label}</p>
                      <p className={`text-xs ${textColor} truncate`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* QR Code */}
              <div className="mt-4 flex justify-center pb-6">
                <div className={`${style.card} rounded-xl p-3`}>
                  <QRCodeSVG
                    value={`https://example.com/c/${formData.slug || 'preview'}`}
                    size={80}
                    fgColor={formData.qr_foreground_color}
                    bgColor={formData.qr_background_color}
                    level="M"
                    imageSettings={formData.qr_logo_url ? {
                      src: formData.qr_logo_url,
                      height: 16,
                      width: 16,
                      excavate: true,
                    } : undefined}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        Template: <span className="capitalize font-medium">{formData.template}</span>
      </p>
    </div>
  );
}

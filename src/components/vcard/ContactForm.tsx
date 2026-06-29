import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle2, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContactFormProps {
  vcardId: string;
  ownerName: string;
  ownerEmail?: string | null;
  accentColor?: string;
  formTitle?: string;
  formDescription?: string;
  onSubmit?: () => void;
}

export default function ContactForm({
  vcardId,
  ownerName,
  ownerEmail,
  accentColor = 'bg-primary',
  formTitle = 'Get in Touch',
  formDescription = 'Send us a message and we\'ll get back to you soon.',
  onSubmit,
}: ContactFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    try {
      // Track contact form submission in analytics
      await supabase.from('vcard_analytics').insert({
        vcard_id: vcardId,
        event_type: 'contact_form',
        link_name: 'contact_form_submit',
        user_agent: navigator.userAgent,
      });

      // Capture lead in CRM (best-effort; RLS validates vcard ownership)
      const { data: ownerRow } = await supabase
        .from('vcards')
        .select('user_id')
        .eq('id', vcardId)
        .maybeSingle();
      if (ownerRow?.user_id) {
        await supabase.from('vcard_leads').insert({
          vcard_id: vcardId,
          user_id: ownerRow.user_id,
          visitor_name: formData.name,
          visitor_email: formData.email,
          visitor_phone: formData.phone || null,
          message: formData.message,
          source: 'contact_form',
          status: 'new',
        });
      }

      // Send email notification via edge function
      await supabase.functions.invoke('send-contact-notification', {
        body: {
          vcard_id: vcardId,
          visitor_name: formData.name,
          visitor_email: formData.email,
          visitor_phone: formData.phone,
          message: formData.message,
        },
      });


      setSubmitted(true);
      onSubmit?.();
      toast({ title: 'Message sent successfully!' });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', message: '' });
        setSubmitted(false);
      }, 3000);

    } catch (error) {
      console.error('Contact form error:', error);
      toast({ title: 'Failed to send message. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle2 size={32} className="text-green-600" />
        </motion.div>
        <h4 className="text-lg font-bold text-green-800 mb-2">Message Sent!</h4>
        <p className="text-green-600 text-sm">
          Thank you for reaching out. We'll get back to you soon.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-2xl p-6"
    >
      {formTitle && (
        <h4 className="text-lg font-bold text-gray-900 mb-2">{formTitle}</h4>
      )}
      {formDescription && (
        <p className="text-sm text-gray-500 mb-6">{formDescription}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your Name *"
            className="pl-10 bg-white border-gray-200 focus:border-primary"
            required
          />
        </div>

        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Your Email *"
            className="pl-10 bg-white border-gray-200 focus:border-primary"
            required
          />
        </div>

        <div className="relative">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone Number (Optional)"
            className="pl-10 bg-white border-gray-200 focus:border-primary"
          />
        </div>

        <div className="relative">
          <MessageSquare size={16} className="absolute left-3 top-3 text-gray-400" />
          <Textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Your Message *"
            className="pl-10 bg-white border-gray-200 focus:border-primary min-h-[120px]"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className={`w-full ${accentColor} text-white font-semibold py-6`}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} className="mr-2" />
              Send Message
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}

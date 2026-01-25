import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'ইমেইল প্রয়োজন',
        description: 'অনুগ্রহ করে আপনার ইমেইল ঠিকানা দিন',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: 'ইমেইল পাঠানো হয়েছে',
        description: 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।',
      });
    } catch (error: any) {
      toast({
        title: 'ত্রুটি',
        description: error.message || 'পাসওয়ার্ড রিসেট ইমেইল পাঠাতে ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-card rounded-3xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">ইমেইল পাঠানো হয়েছে!</h1>
            <p className="text-muted-foreground mb-6">
              <strong>{email}</strong> এ একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। 
              অনুগ্রহ করে আপনার ইমেইল চেক করুন এবং লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              ইমেইল পাননি? স্প্যাম ফোল্ডার চেক করুন অথবা আবার চেষ্টা করুন।
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setEmailSent(false)}
                className="w-full"
              >
                আবার পাঠান
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                লগইন পেজে ফিরুন
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back to Login */}
        <motion.button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft size={20} />
          লগইনে ফিরুন
        </motion.button>

        <div className="glass-card rounded-3xl p-8 shadow-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="Times Digital" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">পাসওয়ার্ড ভুলে গেছেন?</h1>
            <p className="text-muted-foreground mt-2">
              আপনার ইমেইল দিন, আমরা পাসওয়ার্ড রিসেট লিংক পাঠাব।
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ইমেইল অ্যাড্রেস
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  পাঠানো হচ্ছে...
                </>
              ) : (
                'রিসেট লিংক পাঠান'
              )}
            </Button>
          </form>

          {/* Back to Sign In */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              পাসওয়ার্ড মনে আছে?
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-primary font-medium ml-2 hover:underline"
              >
                সাইন ইন করুন
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

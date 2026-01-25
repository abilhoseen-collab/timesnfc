import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('অবৈধ বা মেয়াদ উত্তীর্ণ রিসেট লিংক। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    };
    
    // Listen for auth state changes (password reset)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset link
        setError(null);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: 'পাসওয়ার্ড প্রয়োজন',
        description: 'অনুগ্রহ করে নতুন পাসওয়ার্ড দিন',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'পাসওয়ার্ড খুব ছোট',
        description: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'পাসওয়ার্ড মিলছে না',
        description: 'উভয় পাসওয়ার্ড একই হতে হবে',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'সফল!',
        description: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।',
      });

      // Sign out and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'ত্রুটি',
        description: error.message || 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card rounded-3xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <Lock size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">রিসেট লিংক অবৈধ</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button
              variant="secondary"
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              আবার রিসেট লিংক পাঠান
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card rounded-3xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">পাসওয়ার্ড পরিবর্তন হয়েছে!</h1>
            <p className="text-muted-foreground mb-6">
              আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। 
              এখন আপনি নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              লগইন পেজে যান
            </Button>
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
            <h1 className="text-2xl font-bold text-foreground">নতুন পাসওয়ার্ড সেট করুন</h1>
            <p className="text-muted-foreground mt-2">
              আপনার অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড তৈরি করুন।
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                নতুন পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-background"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">কমপক্ষে ৬ অক্ষর</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  পরিবর্তন হচ্ছে...
                </>
              ) : (
                'পাসওয়ার্ড পরিবর্তন করুন'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

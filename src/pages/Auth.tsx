import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Clock, CheckCircle, XCircle, Chrome } from 'lucide-react';
import logo from '@/assets/logo.png';
import { Separator } from '@/components/ui/separator';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

interface NFCOrderStatus {
  status: 'pending' | 'approved' | 'rejected';
  product_name: string;
  admin_notes?: string;
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [nfcOrderStatus, setNfcOrderStatus] = useState<NFCOrderStatus | null>(null);
  const [checkingOrder, setCheckingOrder] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });
      if (error) {
        toast({
          title: 'Google Sign In Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Check for prefilled email from NFC payment and redirect param
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const pendingType = searchParams.get('pending');
    
    if (emailParam) {
      setEmail(emailParam);
      setIsSignUp(true);
    }
    
    if (pendingType === 'nfc' && emailParam) {
      checkNfcOrderStatus(emailParam);
    }
  }, [searchParams]);

  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const referralCode = searchParams.get('ref')?.toUpperCase() || null;

  // Check NFC order status when email changes during signup
  useEffect(() => {
    if (isSignUp && email && email.includes('@')) {
      const debounceTimer = setTimeout(() => {
        checkNfcOrderStatus(email);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setNfcOrderStatus(null);
    }
  }, [email, isSignUp]);

  const checkNfcOrderStatus = async (emailToCheck: string) => {
    setCheckingOrder(true);
    try {
      const { data, error } = await supabase
        .from('nfc_guest_orders')
        .select('status, product_name, admin_notes')
        .eq('email', emailToCheck.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setNfcOrderStatus({
          status: data.status as 'pending' | 'approved' | 'rejected',
          product_name: data.product_name,
          admin_notes: data.admin_notes || undefined,
        });
      } else {
        setNfcOrderStatus(null);
      }
    } catch (e) {
      console.error('Error checking NFC order:', e);
    }
    setCheckingOrder(false);
  };

  useEffect(() => {
    if (user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        // Check if NFC order is pending
        if (nfcOrderStatus && nfcOrderStatus.status === 'pending') {
          toast({
            title: 'Payment Pending',
            description: 'Your NFC card payment is still being verified. Please wait for admin approval before registering.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Check if NFC order was rejected
        if (nfcOrderStatus && nfcOrderStatus.status === 'rejected') {
          toast({
            title: 'Payment Rejected',
            description: nfcOrderStatus.admin_notes || 'Your payment was rejected. Please contact support.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const result = signUpSchema.safeParse({ fullName, email, password });
        if (!result.success) {
          const fieldErrors: { [key: string]: string } = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to Times Digital. You are now logged in.',
          });
          navigate(redirectPath);
        }
      } else {
        const result = signInSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: { [key: string]: string } = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
          });
          navigate(redirectPath);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOrderStatus = () => {
    if (!isSignUp || !nfcOrderStatus) return null;

    if (nfcOrderStatus.status === 'pending') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Payment Pending</p>
              <p className="text-sm text-yellow-700 mt-1">
                Your <strong>{nfcOrderStatus.product_name}</strong> payment is being verified. 
                You'll be able to register once an admin approves your payment.
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

    if (nfcOrderStatus.status === 'approved') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Payment Approved!</p>
              <p className="text-sm text-green-700 mt-1">
                Your <strong>{nfcOrderStatus.product_name}</strong> payment has been approved. 
                You can now create your account below.
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

    if (nfcOrderStatus.status === 'rejected') {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Payment Rejected</p>
              <p className="text-sm text-red-700 mt-1">
                {nfcOrderStatus.admin_notes || 'Your payment was rejected. Please contact support for assistance.'}
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  const isSignUpDisabled = isSignUp && nfcOrderStatus && nfcOrderStatus.status !== 'approved' && nfcOrderStatus.status !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-orange-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back to Home */}
        <motion.button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft size={20} />
          Back to Home
        </motion.button>

        <div className="glass-card rounded-3xl p-8 shadow-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="Times Digital" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp
                ? 'Start creating your digital business cards'
                : 'Sign in to manage your cards'}
            </p>
          </div>

          {/* NFC Order Status Banner */}
          {renderOrderStatus()}

          {/* Referral Code Banner */}
          {isSignUp && referralCode && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4 text-sm">
              🎁 রেফারেল কোড <span className="font-mono font-bold text-primary">{referralCode}</span> প্রয়োগ করা হবে।
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background"
                />
                {checkingOrder && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full font-semibold"
              disabled={loading || (isSignUpDisabled as boolean)}
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            {/* Google Sign In */}
            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                অথবা
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full font-medium gap-2"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <Chrome size={18} />
              {googleLoading ? 'Connecting...' : 'Google দিয়ে সাইন ইন করুন'}
            </Button>
          </form>

          {/* Forgot Password Link */}
          {!isSignUp && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
          )}

          {/* Toggle */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                  setNfcOrderStatus(null);
                }}
                className="text-primary font-medium ml-2 hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

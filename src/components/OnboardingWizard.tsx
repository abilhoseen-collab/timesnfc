import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, Sparkles, CreditCard, Layout, Gift, ArrowRight } from 'lucide-react';

interface Step {
  icon: typeof Sparkles;
  title: string;
  description: string;
  cta?: { label: string; action: () => void };
}

export function OnboardingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      if (data && data.onboarding_completed === false) setOpen(true);
    })();
  }, [user]);

  const complete = async () => {
    if (!user) return;
    setSkipping(true);
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);
    setSkipping(false);
    setOpen(false);
  };

  const steps: Step[] = [
    {
      icon: Sparkles,
      title: 'Times Digital-এ স্বাগতম!',
      description:
        'আপনার ডিজিটাল বিজনেস কার্ড, NFC কার্ড, এবং ল্যান্ডিং পেজ তৈরির সম্পূর্ণ প্ল্যাটফর্ম। মাত্র কয়েকটি ধাপে শুরু করুন।',
    },
    {
      icon: CreditCard,
      title: 'একটি প্যাকেজ বেছে নিন',
      description:
        'আপনার প্রয়োজন অনুযায়ী Basic, Pro অথবা Business প্যাকেজ থেকে বেছে নিন। প্রতিটি প্যাকেজের সাথে রয়েছে আলাদা ফিচার।',
      cta: { label: 'প্যাকেজ দেখুন', action: () => { complete(); navigate('/payment'); } },
    },
    {
      icon: Layout,
      title: 'প্রথম vCard তৈরি করুন',
      description:
        'টেমপ্লেট নির্বাচন করুন, আপনার তথ্য দিন, এবং তৈরি হয়ে যাবে আপনার নিজস্ব ডিজিটাল বিজনেস কার্ড।',
      cta: { label: 'vCard তৈরি করুন', action: () => { complete(); navigate('/vcard/new'); } },
    },
    {
      icon: Gift,
      title: 'বন্ধুদের রেফার করুন',
      description:
        'আপনার রেফারেল কোড শেয়ার করে বোনাস দিন উপার্জন করুন। বন্ধুরাও পাবে এক্সক্লুসিভ অফার।',
      cta: { label: 'রেফারেল প্রোগ্রাম', action: () => { complete(); navigate('/referrals'); } },
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && complete()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <Progress value={progress} className="h-1.5" />
          <div className="flex flex-col items-center text-center pt-2">
            <motion.div
              key={step}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3"
            >
              <Icon className="text-primary" size={28} />
            </motion.div>
            <DialogTitle className="text-xl">{current.title}</DialogTitle>
            <DialogDescription className="text-base pt-2">
              {current.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {current.cta && (
            <Button onClick={current.cta.action} className="w-full">
              {current.cta.label} <ArrowRight size={16} className="ml-2" />
            </Button>
          )}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                পেছনে
              </Button>
            )}
            {!isLast ? (
              <Button
                variant={current.cta ? 'ghost' : 'default'}
                onClick={() => setStep(step + 1)}
                className="flex-1"
              >
                {current.cta ? 'এড়িয়ে যান' : 'পরবর্তী'}
              </Button>
            ) : (
              <Button onClick={complete} disabled={skipping} className="flex-1">
                <CheckCircle2 size={16} className="mr-2" /> শুরু করুন
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

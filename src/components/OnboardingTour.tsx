import { useEffect, useMemo, useState } from 'react';
import { Joyride, type Step, STATUS } from 'react-joyride';
import { useAuth } from '@/hooks/useAuth';
import { getVariant, trackConversion } from '@/lib/abTesting';

const STORAGE_KEY = 'lovable_onboarding_tour_done';

const STEPS_A: Step[] = [
  { target: 'body', placement: 'center', content: (
    <div><h3 className="font-bold text-lg mb-2">স্বাগতম! 🎉</h3>
      <p>চলুন কয়েক ধাপে আপনার ড্যাশবোর্ড ঘুরে দেখি।</p></div>
  ) },
  { target: '[data-tour="create-card"]', content: 'এখান থেকে নতুন vCard তৈরি করুন।' },
  { target: '[data-tour="leads"]', content: 'আপনার সব Lead এখানে আসবে — CRM হিসাবে ব্যবহার করুন।' },
  { target: '[data-tour="analytics"]', content: 'Analytics এ visitor data, geo map, scroll depth দেখুন।' },
  { target: '[data-tour="settings"]', content: 'Account, Billing, Team — সব কিছু সেটিংস-এ।' },
];

// Variant B: shorter, action-first
const STEPS_B: Step[] = [
  { target: 'body', placement: 'center', content: (
    <div><h3 className="font-bold text-lg mb-2">৩০ সেকেন্ডে শুরু করুন 🚀</h3>
      <p>প্রথমেই vCard বানিয়ে ফেলুন — বাকি ফিচার পরে।</p></div>
  ) },
  { target: '[data-tour="create-card"]', content: '👉 এখানে ক্লিক করে আপনার প্রথম কার্ড তৈরি করুন।' },
  { target: '[data-tour="analytics"]', content: 'Analytics-এ visitor + conversion দেখবেন।' },
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const variant = useMemo(() => getVariant('onboarding_tour', ['A', 'B'] as const), []);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setRun(true), 1200);
    return () => clearTimeout(t);
  }, [user]);

  const handle = (data: any) => {
    if (data.status === STATUS.FINISHED) {
      localStorage.setItem(STORAGE_KEY, '1');
      trackConversion('onboarding_tour', { metadata: { completed: true } });
      setRun(false);
    } else if (data.status === STATUS.SKIPPED) {
      localStorage.setItem(STORAGE_KEY, '1');
      setRun(false);
    }
  };

  if (!user) return null;
  const JoyrideAny = Joyride as any;
  return (
    <JoyrideAny
      steps={variant === 'A' ? STEPS_A : STEPS_B}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handle}
      locale={{ back: 'পেছনে', close: 'বন্ধ', last: 'শেষ', next: 'পরবর্তী', skip: 'এড়িয়ে যান' }}
      styles={{
        options: { primaryColor: '#7c3aed', zIndex: 10000, arrowColor: 'hsl(var(--card))', backgroundColor: 'hsl(var(--card))', textColor: 'hsl(var(--foreground))' },
      }}
    />
  );
}

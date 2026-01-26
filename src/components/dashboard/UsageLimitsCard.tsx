import { CreditCard, Layout, AlertTriangle } from 'lucide-react';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function UsageLimitsCard() {
  const navigate = useNavigate();
  const { 
    currentVcards, 
    vcardLimit, 
    currentLandingPages, 
    landingPageLimit, 
    packageName,
    hasActiveSubscription,
    isLoading 
  } = useSubscriptionLimits();

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-muted rounded w-1/2 mb-6"></div>
        <div className="h-2 bg-muted rounded mb-4"></div>
        <div className="h-2 bg-muted rounded"></div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-destructive/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">সাবস্ক্রিপশন নেই</h3>
            <p className="text-xs text-muted-foreground">প্যাকেজ কিনুন</p>
          </div>
        </div>
        <Button 
          className="w-full" 
          onClick={() => navigate('/payment')}
        >
          প্যাকেজ দেখুন
        </Button>
      </div>
    );
  }

  const vcardPercentage = vcardLimit > 0 ? (currentVcards / vcardLimit) * 100 : 0;
  const landingPagePercentage = landingPageLimit > 0 ? (currentLandingPages / landingPageLimit) * 100 : 0;
  
  const isVcardNearLimit = vcardPercentage >= 80;
  const isLandingNearLimit = landingPagePercentage >= 80;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">ব্যবহার সীমা</h3>
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
          {packageName}
        </span>
      </div>

      <div className="space-y-5">
        {/* VCard Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">VCards</span>
            </div>
            <span className={`text-sm font-bold ${isVcardNearLimit ? 'text-orange-500' : 'text-foreground'}`}>
              {currentVcards} / {vcardLimit}
            </span>
          </div>
          <Progress 
            value={vcardPercentage} 
            className={`h-2 ${isVcardNearLimit ? '[&>div]:bg-orange-500' : ''}`}
          />
          {currentVcards >= vcardLimit && (
            <p className="text-xs text-destructive mt-1">
              সীমা পূর্ণ! আপগ্রেড করুন আরো VCard তৈরি করতে।
            </p>
          )}
        </div>

        {/* Landing Page Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layout size={16} className="text-secondary" />
              <span className="text-sm font-medium text-foreground">Landing Pages</span>
            </div>
            <span className={`text-sm font-bold ${isLandingNearLimit ? 'text-orange-500' : 'text-foreground'}`}>
              {currentLandingPages} / {landingPageLimit}
            </span>
          </div>
          <Progress 
            value={landingPagePercentage} 
            className={`h-2 ${isLandingNearLimit ? '[&>div]:bg-orange-500' : ''}`}
          />
          {currentLandingPages >= landingPageLimit && (
            <p className="text-xs text-destructive mt-1">
              সীমা পূর্ণ! আপগ্রেড করুন আরো Landing Page তৈরি করতে।
            </p>
          )}
        </div>
      </div>

      {(currentVcards >= vcardLimit || currentLandingPages >= landingPageLimit) && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            উচ্চতর প্যাকেজে আপগ্রেড করে আরো VCard ও Landing Page তৈরি করুন।
          </p>
        </div>
      )}
    </div>
  );
}

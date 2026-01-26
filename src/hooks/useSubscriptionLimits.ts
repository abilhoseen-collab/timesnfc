import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SubscriptionLimits {
  vcardLimit: number;
  landingPageLimit: number;
  currentVcards: number;
  currentLandingPages: number;
  canCreateVcard: boolean;
  canCreateLandingPage: boolean;
  packageName: string | null;
  isLoading: boolean;
  hasActiveSubscription: boolean;
}

export function useSubscriptionLimits(): SubscriptionLimits {
  const { user } = useAuth();

  // Fetch active subscription with package details
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription-limits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          expires_at,
          package_id,
          packages (
            id,
            name,
            vcard_limit,
            landing_page_limit
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Count current VCards
  const { data: vcardCount, isLoading: vcardsLoading } = useQuery({
    queryKey: ['vcard-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('vcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error counting vcards:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Count current Landing Pages
  const { data: landingPageCount, isLoading: landingPagesLoading } = useQuery({
    queryKey: ['landing-page-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('landing_pages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error counting landing pages:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
  });

  const isLoading = subscriptionLoading || vcardsLoading || landingPagesLoading;
  const hasActiveSubscription = !!subscription;
  
  // Get limits from package or default to 0 if no subscription
  const packages = subscription?.packages as { 
    id: string; 
    name: string; 
    vcard_limit: number; 
    landing_page_limit: number; 
  } | null;
  
  const vcardLimit = packages?.vcard_limit || 0;
  const landingPageLimit = packages?.landing_page_limit || 0;
  const currentVcards = vcardCount || 0;
  const currentLandingPages = landingPageCount || 0;

  return {
    vcardLimit,
    landingPageLimit,
    currentVcards,
    currentLandingPages,
    canCreateVcard: hasActiveSubscription && currentVcards < vcardLimit,
    canCreateLandingPage: hasActiveSubscription && currentLandingPages < landingPageLimit,
    packageName: packages?.name || null,
    isLoading,
    hasActiveSubscription,
  };
}

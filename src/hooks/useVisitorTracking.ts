import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate or get visitor ID from localStorage
const getVisitorId = (): string => {
  const key = 'visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
};

// Generate session ID (new per session)
const getSessionId = (): string => {
  const key = 'session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

// Check if this is a unique visit (first time this session)
const isUniqueVisit = (resourceId: string, type: 'vcard' | 'landing'): boolean => {
  const key = `visited_${type}_${resourceId}`;
  const visited = sessionStorage.getItem(key);
  if (!visited) {
    sessionStorage.setItem(key, 'true');
    return true;
  }
  return false;
};

interface TrackingOptions {
  resourceId: string;
  resourceType: 'vcard' | 'landing';
  sectionId?: string;
  sectionType?: string;
}

export function useVisitorTracking({ resourceId, resourceType }: TrackingOptions) {
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!resourceId || hasTrackedRef.current) return;
    
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const isUnique = isUniqueVisit(resourceId, resourceType);
    
    const trackView = async () => {
      hasTrackedRef.current = true;
      
      if (resourceType === 'vcard') {
        await supabase.from('vcard_analytics').insert({
          vcard_id: resourceId,
          event_type: 'view',
          visitor_id: visitorId,
          session_id: sessionId,
          is_unique: isUnique,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        });
      } else {
        // Update total_views on landing_pages
        const { data } = await supabase
          .from('landing_pages')
          .select('total_views')
          .eq('id', resourceId)
          .maybeSingle();
        
        if (data) {
          await supabase
            .from('landing_pages')
            .update({ total_views: (data.total_views || 0) + 1 })
            .eq('id', resourceId);
        }
        
        // Insert detailed analytics
        await supabase.from('landing_page_analytics').insert({
          landing_page_id: resourceId,
          event_type: 'view',
          visitor_id: visitorId,
          session_id: sessionId,
          is_unique: isUnique,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        });
      }
    };

    trackView();

    // Track time on page when leaving
    const trackTimeOnPage = async () => {
      const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000);
      
      if (resourceType === 'vcard') {
        // Update the last analytics entry with time
        const { data } = await supabase
          .from('vcard_analytics')
          .select('id')
          .eq('vcard_id', resourceId)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          await supabase
            .from('vcard_analytics')
            .update({ time_on_page: timeOnPage })
            .eq('id', data.id);
        }
      } else {
        const { data } = await supabase
          .from('landing_page_analytics')
          .select('id')
          .eq('landing_page_id', resourceId)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          await supabase
            .from('landing_page_analytics')
            .update({ time_on_page: timeOnPage })
            .eq('id', data.id);
        }
      }
    };

    // Use visibilitychange for more reliable tracking
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', trackTimeOnPage);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', trackTimeOnPage);
    };
  }, [resourceId, resourceType]);

  const trackSectionView = async (sectionId: string, sectionType: string) => {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    await supabase.from('landing_page_analytics').insert({
      landing_page_id: resourceId,
      event_type: 'section_view',
      section_id: sectionId,
      section_type: sectionType,
      visitor_id: visitorId,
      session_id: sessionId,
      is_unique: false,
    });
  };

  const trackClick = async (linkName: string) => {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    if (resourceType === 'vcard') {
      await supabase.from('vcard_analytics').insert({
        vcard_id: resourceId,
        event_type: 'link_click',
        link_name: linkName,
        visitor_id: visitorId,
        session_id: sessionId,
        is_unique: false,
      });
    } else {
      await supabase.from('landing_page_analytics').insert({
        landing_page_id: resourceId,
        event_type: 'click',
        section_id: linkName,
        visitor_id: visitorId,
        session_id: sessionId,
        is_unique: false,
      });
    }
  };

  return { trackSectionView, trackClick };
}

// Calculate visitor stats from analytics data
export function calculateVisitorStats(analyticsData: any[]) {
  const uniqueVisitors = new Set(analyticsData.filter(a => a.is_unique).map(a => a.visitor_id)).size;
  const totalVisits = analyticsData.filter(a => a.event_type === 'view').length;
  const returningVisitors = totalVisits - uniqueVisitors;
  
  // Calculate bounce rate (visits with < 10 seconds on page)
  const bouncedVisits = analyticsData.filter(a => 
    a.event_type === 'view' && (a.time_on_page || 0) < 10
  ).length;
  const bounceRate = totalVisits > 0 ? Math.round((bouncedVisits / totalVisits) * 100) : 0;
  
  // Average time on page
  const timesOnPage = analyticsData
    .filter(a => a.event_type === 'view' && a.time_on_page > 0)
    .map(a => a.time_on_page);
  const avgTimeOnPage = timesOnPage.length > 0 
    ? Math.round(timesOnPage.reduce((a, b) => a + b, 0) / timesOnPage.length)
    : 0;

  return {
    uniqueVisitors,
    returningVisitors,
    totalVisits,
    bounceRate,
    avgTimeOnPage,
  };
}

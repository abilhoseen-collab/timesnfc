import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HomeSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  is_visible: boolean;
  sort_order: number;
}

const STALE = 5 * 60 * 1000;

// Shared single-fetch for every home page section. All `useHomeContent(key)`
// callers read from this cache instead of issuing their own request.
function useHomeContentMap() {
  return useQuery({
    queryKey: ['home-content-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_page_content')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('[useHomeContent]', error);
        return {} as Record<string, HomeSection>;
      }
      const map: Record<string, HomeSection> = {};
      (data || []).forEach((s: any) => { map[s.section_key] = s as HomeSection; });
      return map;
    },
    staleTime: STALE,
    gcTime: STALE * 2,
    refetchOnWindowFocus: false,
  });
}

export function useHomeContent(sectionKey: string) {
  const { data, isLoading } = useHomeContentMap();
  const section = data?.[sectionKey] ?? null;
  const isVisible = section ? section.is_visible : true;
  return {
    section: section && section.is_visible ? section : null,
    loading: isLoading,
    isVisible,
  };
}

export function useAllHomeContent() {
  const { data, isLoading } = useHomeContentMap();
  return { sections: data ?? {}, loading: isLoading };
}

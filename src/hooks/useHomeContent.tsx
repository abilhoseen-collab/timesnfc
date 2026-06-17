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

export function useHomeContent(sectionKey: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['home-content', sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_page_content')
        .select('*')
        .eq('section_key', sectionKey)
        .eq('is_visible', true)
        .maybeSingle();
      if (error) {
        console.error('[useHomeContent]', error);
        return null;
      }
      return (data as HomeSection) || null;
    },
    staleTime: STALE,
    gcTime: STALE * 2,
  });

  return { section: data ?? null, loading: isLoading, isVisible: data?.is_visible ?? true };
}

export function useAllHomeContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-content-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_page_content')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('[useAllHomeContent]', error);
        return {} as Record<string, HomeSection>;
      }
      const map: Record<string, HomeSection> = {};
      (data || []).forEach((s: any) => { map[s.section_key] = s as HomeSection; });
      return map;
    },
    staleTime: STALE,
    gcTime: STALE * 2,
  });

  return { sections: data ?? {}, loading: isLoading };
}

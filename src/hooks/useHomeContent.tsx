import { useState, useEffect } from 'react';
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

export function useHomeContent(sectionKey: string) {
  const [section, setSection] = useState<HomeSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('home_page_content')
        .select('*')
        .eq('section_key', sectionKey)
        .eq('is_visible', true)
        .single();

      if (!error && data) {
        setSection(data as HomeSection);
      }
      setLoading(false);
    };

    fetchContent();
  }, [sectionKey]);

  return { section, loading, isVisible: section?.is_visible ?? true };
}

export function useAllHomeContent() {
  const [sections, setSections] = useState<Record<string, HomeSection>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllContent = async () => {
      const { data, error } = await supabase
        .from('home_page_content')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        const sectionsMap: Record<string, HomeSection> = {};
        data.forEach((section) => {
          sectionsMap[section.section_key] = section as HomeSection;
        });
        setSections(sectionsMap);
      }
      setLoading(false);
    };

    fetchAllContent();
  }, []);

  return { sections, loading };
}

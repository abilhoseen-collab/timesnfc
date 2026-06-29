import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  eta?: string;
}

export function useMaintenanceMode() {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<MaintenanceConfig>({ enabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      if (active) {
        const v = (data?.value as unknown as MaintenanceConfig) ?? { enabled: false };
        setConfig(v);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Admins always bypass
  const blocked = config.enabled && !isAdmin;
  return { config, loading, blocked, isAdmin };
}

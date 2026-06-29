import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  eta?: string;
}

export function useMaintenanceMode() {
  const { user } = useAuth();
  const [config, setConfig] = useState<MaintenanceConfig>({ enabled: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [settingsRes, roleRes] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'maintenance_mode').maybeSingle(),
        user
          ? supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (!active) return;
      const v = (settingsRes.data?.value as unknown as MaintenanceConfig) ?? { enabled: false };
      setConfig(v);
      setIsAdmin(!!roleRes.data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  const blocked = config.enabled && !isAdmin;
  return { config, loading, blocked, isAdmin };
}


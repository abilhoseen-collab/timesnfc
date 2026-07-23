import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  eta?: string;
}

export function useMaintenanceMode() {
  const { user } = useAuth();

  const { data: config, isLoading: settingsLoading } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: async (): Promise<MaintenanceConfig> => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      return ((data?.value as unknown as MaintenanceConfig) ?? { enabled: false });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: isAdmin = false, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const loading = settingsLoading || (!!user?.id && adminLoading);
  const resolved: MaintenanceConfig = config ?? { enabled: false };
  const blocked = resolved.enabled && !isAdmin;
  return { config: resolved, loading, blocked, isAdmin };
}

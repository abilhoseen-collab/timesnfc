import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import Maintenance from '@/pages/Maintenance';

// Paths that should ALWAYS load (so admins can sign in & turn maintenance off,
// and public legal/auth pages stay reachable).
const ALLOWED_PREFIXES = [
  '/auth', '/forgot-password', '/reset-password',
  '/admin', '/maintenance',
  '/privacy-policy', '/terms-of-service', '/refund-policy', '/shipping-policy',
];

export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { blocked, loading } = useMaintenanceMode();
  const { pathname } = useLocation();

  if (loading) return <>{children}</>;
  if (!blocked) return <>{children}</>;
  if (ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return <>{children}</>;
  return <Maintenance />;
}

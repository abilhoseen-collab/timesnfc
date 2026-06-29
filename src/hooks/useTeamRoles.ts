import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TeamRole = "owner" | "admin" | "editor" | "viewer";

const RANK: Record<TeamRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Returns a map of team_id -> current user's role,
 * plus helpers to gate UI actions based on team role.
 *
 * If a resource has team_id = null, treat as personal — only owner can edit
 * (and RLS already enforces this via user_id check).
 */
export function useTeamRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Record<string, TeamRole>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRoles({});
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id);
    const map: Record<string, TeamRole> = {};
    (data || []).forEach((r: any) => {
      map[r.team_id] = r.role as TeamRole;
    });
    setRoles(map);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getRole = (teamId: string | null | undefined): TeamRole | null =>
    teamId ? roles[teamId] ?? null : null;

  const hasMin = (teamId: string | null | undefined, min: TeamRole): boolean => {
    if (!teamId) return true; // personal resource — defer to row-level user_id check
    const r = roles[teamId];
    if (!r) return false;
    return RANK[r] >= RANK[min];
  };

  const canView = (teamId: string | null | undefined, ownerId?: string | null) => {
    if (!teamId) return ownerId ? ownerId === user?.id : true;
    return Boolean(roles[teamId]);
  };

  const canEdit = (teamId: string | null | undefined, ownerId?: string | null) => {
    if (!teamId) return ownerId ? ownerId === user?.id : true;
    return hasMin(teamId, "editor");
  };

  const canDelete = (teamId: string | null | undefined, ownerId?: string | null) => {
    if (!teamId) return ownerId ? ownerId === user?.id : true;
    return hasMin(teamId, "admin");
  };

  const canManageTeam = (teamId: string | null | undefined) =>
    hasMin(teamId, "admin");

  return {
    roles,
    loading,
    refresh,
    getRole,
    hasMin,
    canView,
    canEdit,
    canDelete,
    canManageTeam,
  };
}

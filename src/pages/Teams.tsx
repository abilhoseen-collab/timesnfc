import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Mail, Users, Loader2, Crown } from "lucide-react";

type TeamRole = "owner" | "admin" | "editor" | "viewer";

interface Team {
  id: string;
  name: string;
  owner_id: string;
  is_personal: boolean;
}

interface Member {
  id: string;
  user_id: string;
  role: TeamRole;
  email?: string | null;
  full_name?: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: TeamRole;
  expires_at: string;
  accepted_at: string | null;
  token: string;
}

const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_DESC: Record<TeamRole, string> = {
  owner: "সম্পূর্ণ নিয়ন্ত্রণ",
  admin: "Member ও setting manage",
  editor: "Content create/edit",
  viewer: "শুধু দেখতে পারবে",
};

export default function Teams() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("viewer");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const myRole: TeamRole | undefined = members.find(
    (m) => m.user_id === user?.id
  )?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  async function loadTeams() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,owner_id,is_personal")
      .order("is_personal", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Team লোড করতে সমস্যা: " + error.message);
      setLoading(false);
      return;
    }
    setTeams(data || []);
    if (data && data.length && !activeTeamId) setActiveTeamId(data[0].id);
    setLoading(false);
  }

  async function loadMembersAndInvites(teamId: string) {
    if (!teamId) return;
    const [mRes, iRes] = await Promise.all([
      supabase
        .from("team_members")
        .select("id,user_id,role")
        .eq("team_id", teamId),
      supabase
        .from("team_invitations")
        .select("id,email,role,expires_at,accepted_at,token")
        .eq("team_id", teamId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (mRes.error) {
      toast.error("Member লোড সমস্যা");
      return;
    }

    const ids = (mRes.data || []).map((m) => m.user_id);
    let profileMap: Record<string, { email: string | null; full_name: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,email,full_name")
        .in("id", ids);
      profileMap = Object.fromEntries(
        (profs || []).map((p) => [p.id, { email: p.email, full_name: p.full_name }])
      );
    }
    setMembers(
      (mRes.data || []).map((m) => ({
        ...m,
        role: m.role as TeamRole,
        email: profileMap[m.user_id]?.email ?? null,
        full_name: profileMap[m.user_id]?.full_name ?? null,
      }))
    );
    setInvites(
      ((iRes.data as Invitation[]) || []).map((i) => ({ ...i, role: i.role as TeamRole }))
    );
  }

  useEffect(() => {
    if (user) loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (activeTeamId) loadMembersAndInvites(activeTeamId);
  }, [activeTeamId]);

  async function handleCreateTeam() {
    if (!newTeamName.trim() || !user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("teams")
      .insert({ name: newTeamName.trim(), owner_id: user.id, is_personal: false })
      .select()
      .single();
    if (error) {
      toast.error("Team তৈরি ব্যর্থ: " + error.message);
      setBusy(false);
      return;
    }
    // Add self as owner
    await supabase
      .from("team_members")
      .insert({ team_id: data.id, user_id: user.id, role: "owner" });
    toast.success("নতুন team তৈরি হয়েছে");
    setNewTeamName("");
    setCreateOpen(false);
    setActiveTeamId(data.id);
    await loadTeams();
    setBusy(false);
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !activeTeamId || !user) return;
    setBusy(true);
    try {
      const { data: inv, error } = await supabase
        .from("team_invitations")
        .insert({
          team_id: activeTeamId,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          invited_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // fire-and-wait email
      const { error: fnErr } = await supabase.functions.invoke(
        "send-team-invitation",
        {
          body: {
            invitationId: inv.id,
            email: inv.email,
            teamName: activeTeam?.name,
            inviterName: user.email,
            role: inv.role,
            token: inv.token,
          },
        }
      );
      if (fnErr) toast.warning("Invitation তৈরি হয়েছে কিন্তু email পাঠানো যায়নি");
      else toast.success("Invitation পাঠানো হয়েছে " + inv.email + "-এ");

      setInviteEmail("");
      await loadMembersAndInvites(activeTeamId);
    } catch (e: any) {
      toast.error("Invitation ব্যর্থ: " + e.message);
    }
    setBusy(false);
  }

  async function handleChangeRole(memberId: string, newRole: TeamRole) {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("id", memberId);
    if (error) toast.error("Role পরিবর্তন ব্যর্থ");
    else {
      toast.success("Role আপডেট হয়েছে");
      loadMembersAndInvites(activeTeamId);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("এই member-কে remove করবেন?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", memberId);
    if (error) toast.error("Remove ব্যর্থ: " + error.message);
    else {
      toast.success("Member সরানো হয়েছে");
      loadMembersAndInvites(activeTeamId);
    }
  }

  async function handleCancelInvite(id: string) {
    const { error } = await supabase.from("team_invitations").delete().eq("id", id);
    if (error) toast.error("Cancel ব্যর্থ");
    else {
      toast.success("Invitation বাতিল হয়েছে");
      loadMembersAndInvites(activeTeamId);
    }
  }

  async function handleDeleteTeam() {
    if (!activeTeam || activeTeam.is_personal) return;
    if (!confirm(`"${activeTeam.name}" team delete করবেন? এটা ফেরানো যাবে না।`)) return;
    const { error } = await supabase.from("teams").delete().eq("id", activeTeam.id);
    if (error) toast.error("Delete ব্যর্থ: " + error.message);
    else {
      toast.success("Team delete হয়েছে");
      setActiveTeamId("");
      loadTeams();
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Team Management | TimesNFC</title>
      </Helmet>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" /> Team Management
              </h1>
              <p className="text-sm text-muted-foreground">
                একসাথে কাজ করুন — role-based access
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> নতুন Team
          </Button>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              কোনো team নেই। নতুন একটা তৈরি করুন।
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4">
              <Label className="text-xs">Active Team</Label>
              <Select value={activeTeamId} onValueChange={setActiveTeamId}>
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.is_personal && "👤 "}
                      {t.name}
                      {t.is_personal && " (Personal)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="members">
              <TabsList>
                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                <TabsTrigger value="invitations">
                  Invitations ({invites.length})
                </TabsTrigger>
                {canManage && <TabsTrigger value="settings">Settings</TabsTrigger>}
              </TabsList>

              <TabsContent value="members" className="space-y-3 mt-4">
                {canManage && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" /> নতুন member invite করুন
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-2">
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={inviteRole}
                        onValueChange={(v) => setInviteRole(v as TeamRole)}
                      >
                        <SelectTrigger className="md:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleInvite} disabled={busy || !inviteEmail}>
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Invite"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-4 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold shrink-0">
                              {(m.full_name || m.email || "?")[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate flex items-center gap-1.5">
                                {m.full_name || m.email || "Unknown"}
                                {m.role === "owner" && (
                                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                                )}
                                {m.user_id === user?.id && (
                                  <Badge variant="outline" className="text-[10px]">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {m.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {canManage && m.role !== "owner" ? (
                              <Select
                                value={m.role}
                                onValueChange={(v) =>
                                  handleChangeRole(m.id, v as TeamRole)
                                }
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="secondary">{ROLE_LABEL[m.role]}</Badge>
                            )}
                            {canManage && m.role !== "owner" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveMember(m.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="text-xs text-muted-foreground space-y-1 pt-2">
                  {(Object.keys(ROLE_LABEL) as TeamRole[]).map((r) => (
                    <div key={r}>
                      <span className="font-semibold">{ROLE_LABEL[r]}:</span>{" "}
                      {ROLE_DESC[r]}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="invitations" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {invites.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        কোনো pending invitation নেই
                      </div>
                    ) : (
                      <div className="divide-y">
                        {invites.map((i) => (
                          <div
                            key={i.id}
                            className="flex items-center justify-between p-4 gap-3"
                          >
                            <div className="min-w-0">
                              <div className="font-medium truncate">{i.email}</div>
                              <div className="text-xs text-muted-foreground">
                                Role: {ROLE_LABEL[i.role]} · Expires{" "}
                                {new Date(i.expires_at).toLocaleDateString("bn-BD")}
                              </div>
                            </div>
                            {canManage && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelInvite(i.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {canManage && (
                <TabsContent value="settings" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Team Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Team Name</Label>
                        <Input
                          value={activeTeam?.name || ""}
                          onChange={(e) =>
                            setTeams((ts) =>
                              ts.map((t) =>
                                t.id === activeTeamId
                                  ? { ...t, name: e.target.value }
                                  : t
                              )
                            )
                          }
                          onBlur={async (e) => {
                            await supabase
                              .from("teams")
                              .update({ name: e.target.value })
                              .eq("id", activeTeamId);
                            toast.success("Saved");
                          }}
                          disabled={activeTeam?.is_personal}
                        />
                      </div>
                      {!activeTeam?.is_personal && myRole === "owner" && (
                        <div className="pt-4 border-t">
                          <Button variant="destructive" onClick={handleDeleteTeam}>
                            <Trash2 className="h-4 w-4 mr-1" /> Team Delete
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নতুন Team তৈরি</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Team Name</Label>
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="যেমন: Marketing Team"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={handleCreateTeam} disabled={busy || !newTeamName.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "তৈরি করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

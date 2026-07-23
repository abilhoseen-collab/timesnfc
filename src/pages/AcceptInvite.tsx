import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errorHandler";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"idle" | "accepting" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function accept() {
    if (!token || status === "accepting") return;
    setStatus("accepting");
    const { error } = await supabase.rpc("accept_team_invitation", { _token: token });
    if (error) {
      const friendly = getUserFriendlyError(error);
      setErrorMsg(friendly);
      setStatus("error");
      toast.error(friendly);
    } else {
      setStatus("done");
      toast.success("Team-এ যুক্ত হয়েছেন!");
      setTimeout(() => navigate("/teams"), 1500);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      // redirect to auth with return path
      navigate(
        `/auth?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`
      );
    }
  }, [authLoading, user, navigate, token]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Helmet>
        <title>Invitation Accept | TimesNFC</title>
      </Helmet>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {!token ? (
            <p className="text-sm text-destructive">Invalid invitation link</p>
          ) : status === "idle" ? (
            <>
              <p className="text-sm text-muted-foreground">
                আপনাকে একটি team-এ join করার জন্য invite করা হয়েছে। Accept করতে নিচের
                button-এ click করুন।
              </p>
              <Button onClick={accept} className="w-full">
                Accept Invitation
              </Button>
            </>
          ) : status === "accepting" ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Joining team...</p>
            </div>
          ) : status === "done" ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm">সফলভাবে join হয়েছেন! Redirecting...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-destructive">{errorMsg}</p>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Dashboard-এ যান
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

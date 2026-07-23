import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import TeamManagementPanel from "@/components/TeamManagementPanel";
import { LoadingState } from "@/components/common/LoadingState";

export default function Teams() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return <LoadingState variant="spinner" label="যাচাই করা হচ্ছে..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Team Management | TimesNFC</title>
      </Helmet>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
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
        <TeamManagementPanel />
      </div>
    </div>
  );
}

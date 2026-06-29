import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Monitor, Smartphone, MapPin } from "lucide-react";

interface ActivityRow {
  id: string;
  ip_address: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  success: boolean;
  event_type: string;
  created_at: string;
}

export default function LoginActivityList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("login_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setRows((data as ActivityRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login Activity</CardTitle>
        <CardDescription>সর্বশেষ ৫০টি লগইন ইভেন্ট। অপরিচিত activity দেখলে পাসওয়ার্ড পরিবর্তন করুন।</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">কোনো activity নেই।</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card/50">
                <div className="flex items-start gap-3 min-w-0">
                  {r.device === "mobile" ? (
                    <Smartphone size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <Monitor size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{r.browser || "Unknown browser"}</span>
                      <Badge variant={r.success ? "secondary" : "destructive"} className="text-[10px]">
                        {r.event_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.os || ""}</p>
                    {(r.city || r.country) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {[r.city, r.country].filter(Boolean).join(", ")} {r.ip_address ? `• ${r.ip_address}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(r.created_at).toLocaleString("en-GB")}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

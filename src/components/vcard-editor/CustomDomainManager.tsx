import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Globe, Loader2, RefreshCw, Trash2 } from "lucide-react";

interface Props {
  vcardId: string;
}

interface Domain {
  id: string;
  domain: string;
  verification_token: string;
  status: string;
  verified_at: string | null;
}

export default function CustomDomainManager({ vcardId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDomains = async () => {
    const { data } = await supabase
      .from("vcard_custom_domains")
      .select("*")
      .eq("vcard_id", vcardId)
      .order("created_at", { ascending: false });
    setDomains((data as Domain[]) || []);
  };

  useEffect(() => {
    if (vcardId) fetchDomains();
  }, [vcardId]);

  const handleAdd = async () => {
    if (!user || !newDomain.trim()) return;
    const cleaned = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    setLoading(true);
    const { error } = await supabase.from("vcard_custom_domains").insert({
      vcard_id: vcardId,
      user_id: user.id,
      domain: cleaned,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setNewDomain("");
    fetchDomains();
  };

  const handleVerify = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("verify-custom-domain", { body: { domain_id: id } });
    setLoading(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification triggered", description: "DNS check চলছে…" });
      fetchDomains();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("vcard_custom_domains").delete().eq("id", id);
    fetchDomains();
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast({ title: "Copied!" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe size={18} /> Custom Domain</CardTitle>
        <CardDescription>
          আপনার নিজের ডোমেইন (যেমন <code className="text-xs">card.company.com</code>) এই vCard-এ যুক্ত করুন।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="card.yourdomain.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            maxLength={255}
          />
          <Button onClick={handleAdd} disabled={loading || !newDomain.trim()}>
            যোগ করুন
          </Button>
        </div>

        {domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">এখনো কোনো custom domain যোগ করা হয়নি।</p>
        ) : (
          domains.map((d) => (
            <div key={d.id} className="border border-border rounded-lg p-3 space-y-3 bg-card/50">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{d.domain}</p>
                  <Badge variant={d.status === "verified" ? "secondary" : "outline"} className="mt-1 text-[10px]">
                    {d.status}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleVerify(d.id)} disabled={loading}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {d.status !== "verified" && (
                <div className="text-xs space-y-2 bg-muted/30 p-3 rounded">
                  <p className="font-medium">DNS Setup (আপনার domain provider-এ এই দুটি record যোগ করুন):</p>
                  <div>
                    <Label className="text-[10px]">1. CNAME record</Label>
                    <div className="flex items-center gap-1 mt-1 font-mono text-[11px]">
                      <code className="flex-1 truncate">{d.domain.split(".")[0]} → timesnfc.lovable.app</code>
                      <Button size="sm" variant="ghost" onClick={() => copy("timesnfc.lovable.app")}>
                        <Copy size={12} />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">2. TXT record (verification)</Label>
                    <div className="flex items-center gap-1 mt-1 font-mono text-[11px]">
                      <code className="flex-1 truncate">_times-verify.{d.domain} → {d.verification_token}</code>
                      <Button size="sm" variant="ghost" onClick={() => copy(d.verification_token)}>
                        <Copy size={12} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground">DNS propagate-এ ৫ মিনিট থেকে ৪৮ ঘণ্টা সময় লাগতে পারে।</p>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

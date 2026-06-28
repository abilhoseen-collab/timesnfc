import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Loader2,
  Download,
  ArrowUpCircle,
  RefreshCw,
} from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  amount: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  packages: { name: string; vcard_limit: number; landing_page_limit: number } | null;
}

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, status, amount, starts_at, expires_at, created_at, packages(name, vcard_limit, landing_page_limit)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSubscriptions((data || []) as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeSub = subscriptions.find(
    (s) => s.status === "approved" && s.expires_at && new Date(s.expires_at) > new Date()
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { class: string; label: string; icon: typeof CheckCircle }> = {
      approved: { class: "bg-green-500/10 text-green-700 dark:text-green-400", label: "অনুমোদিত", icon: CheckCircle },
      pending: { class: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", label: "অপেক্ষমাণ", icon: Clock },
      rejected: { class: "bg-red-500/10 text-red-700 dark:text-red-400", label: "প্রত্যাখ্যাত", icon: XCircle },
    };
    const v = variants[status] || variants.pending;
    const Icon = v.icon;
    return (
      <Badge variant="outline" className={`${v.class} gap-1 border-0`}>
        <Icon size={12} /> {v.label}
      </Badge>
    );
  };

  const daysLeft = activeSub?.expires_at
    ? Math.max(0, Math.ceil((new Date(activeSub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const downloadInvoice = (sub: Subscription) => {
    const content = `
====================================
       Times Digital - ইনভয়েস
====================================

ইনভয়েস নম্বর: ${sub.id.slice(0, 8).toUpperCase()}
তারিখ: ${new Date(sub.created_at).toLocaleDateString("bn-BD")}

ইউজার: ${user?.email}

------------------------------------
প্যাকেজ:      ${sub.packages?.name || "N/A"}
পরিমাণ:      ৳ ${sub.amount}
স্ট্যাটাস:    ${sub.status}
শুরু:        ${sub.starts_at ? new Date(sub.starts_at).toLocaleDateString("bn-BD") : "—"}
মেয়াদ শেষ:   ${sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("bn-BD") : "—"}
------------------------------------

মোট:        ৳ ${sub.amount}

ধন্যবাদ!
====================================
`.trim();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${sub.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Helmet>
        <title>বিলিং ও সাবস্ক্রিপশন | Times Digital</title>
        <meta name="description" content="আপনার সাবস্ক্রিপশন, পেমেন্ট ইতিহাস ও ইনভয়েস" />
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4 gap-2">
          <ArrowLeft size={16} /> ড্যাশবোর্ডে ফিরুন
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">বিলিং ও সাবস্ক্রিপশন</h1>
          <p className="text-muted-foreground mt-1">আপনার সাবস্ক্রিপশন ও পেমেন্ট ম্যানেজ করুন</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            {/* Active Subscription */}
            <Card className="mb-6 border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="text-primary" size={20} />
                      বর্তমান সাবস্ক্রিপশন
                    </CardTitle>
                    <CardDescription>আপনার সক্রিয় প্যাকেজের তথ্য</CardDescription>
                  </div>
                  {activeSub && getStatusBadge(activeSub.status)}
                </div>
              </CardHeader>
              <CardContent>
                {activeSub ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">প্যাকেজ</p>
                      <p className="text-lg font-bold text-foreground">
                        {activeSub.packages?.name || "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">মাসিক মূল্য</p>
                      <p className="text-lg font-bold text-foreground">৳ {activeSub.amount}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">মেয়াদ বাকি</p>
                      <p className="text-lg font-bold text-foreground">
                        {daysLeft} <span className="text-sm font-normal">দিন</span>
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">মেয়াদ শেষ</p>
                      <p className="text-sm font-bold text-foreground flex items-center gap-1">
                        <Calendar size={14} />
                        {activeSub.expires_at
                          ? new Date(activeSub.expires_at).toLocaleDateString("bn-BD")
                          : "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">কোনো সক্রিয় সাবস্ক্রিপশন নেই</p>
                    <Button onClick={() => navigate("/#pricing")}>
                      প্যাকেজ দেখুন
                    </Button>
                  </div>
                )}

                {activeSub && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                    <Button onClick={() => navigate("/payment")} className="gap-1.5">
                      <RefreshCw size={14} /> রিনিউ করুন
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/payment")} className="gap-1.5">
                      <ArrowUpCircle size={14} /> আপগ্রেড করুন
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle>পেমেন্ট ইতিহাস</CardTitle>
                <CardDescription>আপনার সকল সাবস্ক্রিপশন ও ইনভয়েস</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">কোনো ইতিহাস নেই</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>তারিখ</TableHead>
                        <TableHead>প্যাকেজ</TableHead>
                        <TableHead>পরিমাণ</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead className="text-right">ইনভয়েস</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="text-sm">
                            {new Date(sub.created_at).toLocaleDateString("bn-BD")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {sub.packages?.name || "—"}
                          </TableCell>
                          <TableCell>৳ {sub.amount}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell className="text-right">
                            {sub.status === "approved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadInvoice(sub)}
                                className="gap-1.5"
                              >
                                <Download size={14} /> ডাউনলোড
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

const EXPORT_TABLES = [
  "profiles", "vcards", "vcard_leads", "vcard_appointments",
  "landing_pages", "orders", "invoices", "notifications",
  "notification_preferences", "login_activity", "referrals",
] as const;

export default function GDPRDataPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const result: Record<string, any> = { exported_at: new Date().toISOString(), user_id: user.id };
      for (const table of EXPORT_TABLES) {
        const col = table === "profiles" ? "id" : "user_id";
        const { data } = await supabase.from(table as any).select("*").eq(col, user.id);
        result[table] = data || [];
      }
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${user.id.slice(0, 8)}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "ডেটা ডাউনলোড হয়েছে", description: "আপনার সব ডেটা JSON file-এ সংরক্ষিত।" });
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // RPC anonymizes profile & creates deletion notice
      await supabase.rpc("request_account_deletion");
      // Invoke edge function to delete auth user
      await supabase.functions.invoke("delete-user-account");
      await supabase.auth.signOut();
      toast({ title: "অ্যাকাউন্ট ডিলিট হয়েছে", description: "সকল ডেটা মুছে ফেলা হয়েছে।" });
      navigate("/");
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>আপনার ডেটা ডাউনলোড করুন</CardTitle>
          <CardDescription>
            GDPR-অনুযায়ী আপনার সব ডেটা JSON ফরম্যাটে এক্সপোর্ট করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            সব ডেটা ডাউনলোড করুন (JSON)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">অ্যাকাউন্ট স্থায়ীভাবে ডিলিট</CardTitle>
          <CardDescription>
            এই কাজটি অপরিবর্তনীয়। সকল vCard, lead, invoice ও সাবস্ক্রিপশন মুছে যাবে।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2" disabled={deleting}>
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                অ্যাকাউন্ট ডিলিট করুন
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>আপনি কি একদম নিশ্চিত?</AlertDialogTitle>
                <AlertDialogDescription>
                  সকল ডেটা স্থায়ীভাবে মুছে যাবে এবং পুনরুদ্ধার সম্ভব নয়। চালিয়ে যেতে চান?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  হ্যাঁ, ডিলিট করুন
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

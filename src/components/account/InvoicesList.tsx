import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";
import { downloadInvoicePdf, type InvoiceLineItem } from "@/lib/invoicePdf";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_address: string | null;
  line_items: InvoiceLineItem[];
  issued_at: string;
}

export default function InvoicesList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, [user]);

  const handleDownload = (inv: InvoiceRow) => {
    downloadInvoicePdf({
      invoice_number: inv.invoice_number,
      issued_at: inv.issued_at,
      customer_name: inv.customer_name,
      customer_email: inv.customer_email,
      customer_address: inv.customer_address,
      line_items: Array.isArray(inv.line_items) ? inv.line_items : [],
      currency: inv.currency,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices / Receipts</CardTitle>
        <CardDescription>সব পেমেন্টের রসিদ PDF আকারে ডাউনলোড করুন</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">কোনো invoice নেই।</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/50">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText size={18} className="text-muted-foreground shrink-0 mt-1" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">#{r.invoice_number}</span>
                      <Badge variant={r.status === "paid" ? "secondary" : "outline"}>{r.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.issued_at).toLocaleDateString("en-GB")} • {r.currency} {Number(r.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDownload(r)} className="gap-2">
                  <Download size={14} /> PDF
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

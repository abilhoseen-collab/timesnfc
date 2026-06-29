// Creates an invoice row for a completed order / subscription
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      user_id,
      order_id,
      subscription_id,
      amount,
      currency = "BDT",
      customer_name,
      customer_email,
      customer_address,
      line_items,
    } = body as {
      user_id: string;
      order_id?: string;
      subscription_id?: string;
      amount: number;
      currency?: string;
      customer_name?: string;
      customer_email?: string;
      customer_address?: string;
      line_items: InvoiceLineItem[];
    };

    if (!user_id || !amount || !line_items) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const invoice_number = `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        user_id,
        invoice_number,
        order_id,
        subscription_id,
        amount,
        currency,
        customer_name,
        customer_email,
        customer_address,
        line_items,
        status: "paid",
      })
      .select()
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ invoice: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});

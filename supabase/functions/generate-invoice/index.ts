// Creates an invoice row for a completed order / subscription.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withHandler, json, parseJson } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { z, zEmail, zPositiveAmount, zUUID } from "../_shared/validate.ts";

const FN = "generate-invoice";

const LineItem = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.number().int().positive(),
  unit_price: z.number().finite().nonnegative(),
  total: z.number().finite().nonnegative(),
});

const Body = z.object({
  user_id: zUUID,
  order_id: zUUID.optional(),
  subscription_id: zUUID.optional(),
  amount: zPositiveAmount,
  currency: z.string().trim().length(3).toUpperCase().default("BDT"),
  customer_name: z.string().trim().max(200).optional(),
  customer_email: zEmail.optional(),
  customer_address: z.string().trim().max(1000).optional(),
  line_items: z.array(LineItem).min(1).max(50),
});

Deno.serve(withHandler(FN, async (req) => {
  const body = await parseJson(req, Body);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const invoice_number = `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...body, invoice_number, status: "paid" })
    .select()
    .single();

  if (error) {
    throw new HttpError(500, "DB_INSERT_FAILED", "Invoice তৈরি করতে ব্যর্থ।", { detail: error.message });
  }

  return json({ invoice: data });
}));

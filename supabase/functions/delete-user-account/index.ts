// Deletes the authenticated user's account and all their data (cascade via FKs).
import { createClient } from "npm:@supabase/supabase-js@2";
import { withHandler, json, requireBearer } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { logInfo } from "../_shared/logger.ts";

const FN = "delete-user-account";

Deno.serve(withHandler(FN, async (req, ctx) => {
  const token = requireBearer(req);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: userData, error: getUserErr } = await supabase.auth.getUser(token);
  if (getUserErr || !userData?.user) {
    throw new HttpError(401, "UNAUTHORIZED", "অনুমতি নেই — আবার লগইন করুন।");
  }
  const userId = userData.user.id;
  logInfo(FN, "deleting.user", { requestId: ctx.requestId, userId });

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw new HttpError(500, "DELETE_FAILED", "অ্যাকাউন্ট মুছতে ব্যর্থ হয়েছে।", { detail: error.message });
  }

  return json({ deleted: true });
}));

// Verifies a Twilio Verify OTP through the Lovable gateway.
import { withHandler, json, parseJson } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { logInfo } from "../_shared/logger.ts";
import { z, zPhone } from "../_shared/validate.ts";

const FN = "twilio-verify-otp";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

const Body = z.object({
  phone: zPhone,
  code: z.string().trim().min(3).max(10).regex(/^\d+$/, { message: "সঠিক কোড দিন" }),
});

Deno.serve(withHandler(FN, async (req, ctx) => {
  const { phone, code } = await parseJson(req, Body);

  const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const twilioKey = Deno.env.get("TWILIO_API_KEY");
  if (!verifySid || !lovableKey || !twilioKey) {
    throw new HttpError(500, "CONFIG_ERROR", "Twilio কনফিগার করা নেই।");
  }

  const res = await fetch(`${GATEWAY_URL}/Verify/v2/Services/${verifySid}/VerificationCheck`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, Code: code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    logInfo(FN, "twilio.error", { requestId: ctx.requestId, status: res.status, twilioCode: data?.code });
    throw new HttpError(
      res.status >= 500 ? 502 : 400,
      "TWILIO_ERROR",
      data?.message || "OTP যাচাই ব্যর্থ হয়েছে।",
    );
  }
  return json({ verified: data.status === "approved", status: data.status });
}));

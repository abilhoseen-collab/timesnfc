// Sends Twilio Verify OTP via SMS or WhatsApp through the Lovable gateway.
import { withHandler, json, parseJson } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { logInfo } from "../_shared/logger.ts";
import { z, zPhone } from "../_shared/validate.ts";

const FN = "twilio-send-otp";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

const Body = z.object({
  phone: zPhone,
  channel: z.enum(["sms", "whatsapp"]).default("sms"),
});

Deno.serve(withHandler(FN, async (req, ctx) => {
  const { phone, channel } = await parseJson(req, Body);

  const verifySid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const twilioKey = Deno.env.get("TWILIO_API_KEY");
  if (!verifySid || !lovableKey || !twilioKey) {
    throw new HttpError(500, "CONFIG_ERROR", "Twilio কনফিগার করা নেই।");
  }

  const res = await fetch(`${GATEWAY_URL}/Verify/v2/Services/${verifySid}/Verifications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, Channel: channel }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    logInfo(FN, "twilio.error", { requestId: ctx.requestId, status: res.status, twilioCode: data?.code });
    throw new HttpError(
      res.status >= 500 ? 502 : 400,
      "TWILIO_ERROR",
      data?.message || "OTP পাঠাতে ব্যর্থ হয়েছে।",
    );
  }
  return json({ status: data.status, sid: data.sid });
}));

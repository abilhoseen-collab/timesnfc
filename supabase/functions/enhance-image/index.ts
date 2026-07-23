// AI headshot enhancement via Lovable AI Gateway (Gemini image model).
import { withHandler, json, parseJson } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { logInfo } from "../_shared/logger.ts";
import { z } from "../_shared/validate.ts";

const FN = "enhance-image";

const Body = z.object({
  imageBase64: z.string().min(20, { message: "imageBase64 প্রয়োজন" }).max(15_000_000),
  prompt: z.string().trim().max(2000).optional(),
});

const DEFAULT_PROMPT =
  "Professional headshot enhancement: improve lighting, sharpness, colour balance, remove background noise, studio-quality finish. Keep facial features identical.";

Deno.serve(withHandler(FN, async (req, ctx) => {
  const { imageBase64, prompt } = await parseJson(req, Body);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new HttpError(500, "CONFIG_ERROR", "AI সেবা কনফিগার করা নেই।");
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt || DEFAULT_PROMPT },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logInfo(FN, "ai.gateway.error", { requestId: ctx.requestId, status: res.status, body: text.slice(0, 500) });
    if (res.status === 429) throw new HttpError(429, "RATE_LIMITED", "AI সার্ভিসে অনেক অনুরোধ। পরে চেষ্টা করুন।");
    if (res.status === 402) throw new HttpError(402, "QUOTA_EXCEEDED", "AI ক্রেডিট শেষ।");
    throw new HttpError(502, "AI_ERROR", "AI সেবা সাময়িক অনুপলব্ধ।");
  }

  const data = await res.json();
  const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    throw new HttpError(502, "AI_EMPTY_RESULT", "AI থেকে ইমেজ পাওয়া যায়নি।");
  }
  return json({ imageUrl });
}));

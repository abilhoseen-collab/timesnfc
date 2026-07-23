import { z } from "npm:zod@3.23.8";
import { withHandler, parseJson, json } from "../_shared/handler.ts";
import { HttpError } from "../_shared/errors.ts";
import { logInfo, logError } from "../_shared/logger.ts";

const Body = z.object({
  name: z.string().trim().max(120).optional().default(""),
  job_title: z.string().trim().max(120).optional().default(""),
  company: z.string().trim().max(160).optional().default(""),
  keywords: z.string().trim().max(500).optional().default(""),
  tone: z.enum(["professional", "friendly", "creative"]).optional().default("professional"),
  language: z.enum(["bn", "en"]).optional().default("bn"),
});

const toneMap = {
  professional: "professional and authoritative",
  friendly: "warm, friendly, and approachable",
  creative: "creative, energetic, and unique",
} as const;

Deno.serve(withHandler("generate-vcard-bio", async (req, ctx) => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new HttpError(500, "CONFIG_MISSING", "AI সেবা কনফিগার করা হয়নি।");
  }

  const { name, job_title, company, keywords, tone, language } = await parseJson(req, Body);
  if (!name && !job_title && !keywords) {
    throw new HttpError(400, "MISSING_INPUT", "অন্তত নাম, পেশা বা কীওয়ার্ড দিন");
  }

  const langInstruction = language === "bn"
    ? "Write the bio in natural Bengali (Bangla, বাংলা)."
    : "Write the bio in English.";

  const userPrompt = `Write a short ${toneMap[tone]} bio (2-3 sentences, max 280 characters) for a digital business card.

Person details:
- Name: ${name || "(not provided)"}
- Job title: ${job_title || "(not provided)"}
- Company/organization: ${company || "(not provided)"}
- Keywords/highlights: ${keywords || "(none)"}

Rules:
- ${langInstruction}
- Do NOT include any greeting like "Hello" or "Hi".
- Do NOT use quotes, markdown, hashtags, or emojis.
- Return ONLY the bio text, nothing else.`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You write concise, high-quality professional bios for digital business cards." },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    logError("generate-vcard-bio", "ai.error", errText, { requestId: ctx.requestId, status: aiRes.status });
    if (aiRes.status === 429) {
      throw new HttpError(429, "RATE_LIMITED", "অনেক বেশি অনুরোধ। একটু পরে আবার চেষ্টা করুন।");
    }
    if (aiRes.status === 402) {
      throw new HttpError(402, "QUOTA_EXCEEDED", "AI ক্রেডিট শেষ। অ্যাডমিনের সাথে যোগাযোগ করুন।");
    }
    throw new HttpError(502, "AI_UPSTREAM", "AI সেবা সাময়িকভাবে অনুপলব্ধ।");
  }

  const data = await aiRes.json();
  const bio = (data.choices?.[0]?.message?.content || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\*\*/g, "");

  logInfo("generate-vcard-bio", "ok", { requestId: ctx.requestId, len: bio.length });
  return json({ bio });
}));

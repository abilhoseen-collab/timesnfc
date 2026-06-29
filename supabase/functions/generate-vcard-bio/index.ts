import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReqBody {
  name?: string;
  job_title?: string;
  company?: string;
  keywords?: string;
  tone?: "professional" | "friendly" | "creative";
  language?: "bn" | "en";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ReqBody = await req.json();
    const { name = "", job_title = "", company = "", keywords = "", tone = "professional", language = "bn" } = body;

    if (!job_title.trim() && !keywords.trim() && !name.trim()) {
      return new Response(JSON.stringify({ error: "অন্তত নাম, পেশা বা কীওয়ার্ড দিন" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langInstruction = language === "bn"
      ? "Write the bio in natural Bengali (Bangla, বাংলা)."
      : "Write the bio in English.";

    const toneMap = {
      professional: "professional and authoritative",
      friendly: "warm, friendly, and approachable",
      creative: "creative, energetic, and unique",
    };

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
        "Authorization": `Bearer ${apiKey}`,
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
      console.error("AI gateway error", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "অনেক বেশি অনুরোধ। একটু পরে আবার চেষ্টা করুন।" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI ক্রেডিট শেষ। অ্যাডমিনের সাথে যোগাযোগ করুন।" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI সেবা সাময়িকভাবে অনুপলব্ধ।" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const bio = (data.choices?.[0]?.message?.content || "").trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\*\*/g, "");

    return new Response(JSON.stringify({ bio }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-vcard-bio error", e);
    return new Response(JSON.stringify({ error: "একটি ত্রুটি ঘটেছে।" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

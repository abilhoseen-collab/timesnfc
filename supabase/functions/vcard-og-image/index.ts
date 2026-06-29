// Dynamic Open Graph PNG image for vCards (true raster, not SVG).
// Renders an SVG with @resvg/resvg-wasm into a 1200x630 PNG.
// Usage: /functions/v1/vcard-og-image?slug=<slug>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let wasmReady: Promise<void> | null = null;
function ensureWasm() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const res = await fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
      const buf = await res.arrayBuffer();
      await initWasm(buf);
    })();
  }
  return wasmReady;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function bufferToBase64(buf: Uint8Array) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    s += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(s);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const format = url.searchParams.get("format") || "png"; // png | svg
    if (!slug) return new Response("Missing slug", { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: vcard } = await supabase
      .from("vcards")
      .select("name, job_title, company, photo_url")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    const name = escape((vcard?.name ?? "Digital Business Card").slice(0, 40));
    const job = escape((vcard?.job_title ?? "").slice(0, 60));
    const company = escape((vcard?.company ?? "").slice(0, 60));
    const initial = (vcard?.name ?? "T").charAt(0).toUpperCase();

    let photoDataUri: string | null = null;
    if (vcard?.photo_url) {
      try {
        const res = await fetch(vcard.photo_url);
        if (res.ok) {
          const buf = new Uint8Array(await res.arrayBuffer());
          const ct = res.headers.get("content-type") ?? "image/jpeg";
          photoDataUri = `data:${ct};base64,${bufferToBase64(buf)}`;
        }
      } catch (_) { /* ignore */ }
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a0529"/>
      <stop offset="1" stop-color="#5b21b6"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#a855f7"/>
      <stop offset="1" stop-color="#ec4899"/>
    </linearGradient>
    <clipPath id="avatar"><circle cx="240" cy="315" r="170"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="100" r="200" fill="url(#accent)" opacity="0.18"/>
  <circle cx="100" cy="560" r="240" fill="url(#accent)" opacity="0.12"/>
  <circle cx="240" cy="315" r="180" fill="#ffffff" opacity="0.15"/>
  ${photoDataUri
    ? `<image href="${photoDataUri}" x="70" y="145" width="340" height="340" clip-path="url(#avatar)" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="240" cy="315" r="170" fill="url(#accent)"/>
       <text x="240" y="365" font-family="Arial,sans-serif" font-size="160" font-weight="800" fill="#fff" text-anchor="middle">${escape(initial)}</text>`}
  <text x="460" y="270" font-family="Arial,sans-serif" font-size="64" font-weight="800" fill="#ffffff">${name}</text>
  ${job ? `<text x="460" y="340" font-family="Arial,sans-serif" font-size="36" fill="#e9d5ff">${job}</text>` : ""}
  ${company ? `<text x="460" y="390" font-family="Arial,sans-serif" font-size="32" fill="#c4b5fd">${company}</text>` : ""}
  <rect x="460" y="450" width="220" height="60" rx="30" fill="url(#accent)"/>
  <text x="570" y="491" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">Digital vCard</text>
  <text x="1140" y="600" font-family="Arial,sans-serif" font-size="22" font-weight="600" fill="#ffffff" text-anchor="end" opacity="0.7">Times Digital</text>
</svg>`;

    if (format === "svg") {
      return new Response(svg, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    // Render to PNG via resvg-wasm
    await ensureWasm();
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: { loadSystemFonts: false, defaultFontFamily: "Arial" },
    });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    return new Response(`Error: ${(err as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});

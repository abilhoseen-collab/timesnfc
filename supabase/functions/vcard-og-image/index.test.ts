import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";
import { fnUrl, ANON_KEY } from "../_shared/testing.ts";

Deno.test("vcard-og-image: 400 missing slug", async () => {
  const res = await callFn("vcard-og-image", { method: "GET" });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("vcard-og-image: svg renders for unknown slug (fallback)", async () => {
  const url = `${fnUrl("vcard-og-image")}?slug=unknown-xyz&format=svg`;
  const res = await fetch(url, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } });
  const text = await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type")?.startsWith("image/svg+xml"), true);
  if (!text.includes("<svg")) throw new Error("Expected SVG output");
});

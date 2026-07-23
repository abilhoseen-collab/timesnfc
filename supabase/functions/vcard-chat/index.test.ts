import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("vcard-chat: 400 on empty body", async () => {
  const res = await callFn("vcard-chat", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("vcard-chat: 400 on invalid JSON", async () => {
  const res = await callFn("vcard-chat", { method: "POST", body: "{bad" });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "INVALID_JSON");
});

Deno.test("vcard-chat: 404 unknown slug", async () => {
  const res = await callFn("vcard-chat", {
    method: "POST",
    body: JSON.stringify({ slug: "definitely-not-a-real-slug-xyz", messages: [{ role: "user", content: "hi" }] }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 404);
  assertEquals(body.code, "VCARD_NOT_FOUND");
});

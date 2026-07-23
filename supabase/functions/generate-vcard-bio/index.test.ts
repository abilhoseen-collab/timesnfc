// Integration tests for generate-vcard-bio.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("generate-vcard-bio: 400 when all fields empty", async () => {
  const res = await callFn("generate-vcard-bio", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "MISSING_INPUT");
});

Deno.test("generate-vcard-bio: 400 on invalid JSON", async () => {
  const res = await callFn("generate-vcard-bio", { method: "POST", body: "{bad" });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "INVALID_JSON");
});

Deno.test("generate-vcard-bio: 400 on invalid tone", async () => {
  const res = await callFn("generate-vcard-bio", {
    method: "POST",
    body: JSON.stringify({ name: "Test", tone: "not-a-tone" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

// Integration tests for verify-custom-domain.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("verify-custom-domain: 400 on missing domain_id", async () => {
  const res = await callFn("verify-custom-domain", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("verify-custom-domain: 400 on non-UUID domain_id", async () => {
  const res = await callFn("verify-custom-domain", {
    method: "POST",
    body: JSON.stringify({ domain_id: "abc" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("verify-custom-domain: 404 for unknown UUID", async () => {
  const res = await callFn("verify-custom-domain", {
    method: "POST",
    body: JSON.stringify({ domain_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 404);
  assertEquals(body.code, "NOT_FOUND");
});

// Integration tests for generate-invoice.
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("generate-invoice: 400 on missing body", async () => {
  const res = await callFn("generate-invoice", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
  assertExists(body.requestId);
});

Deno.test("generate-invoice: 400 on invalid email", async () => {
  const res = await callFn("generate-invoice", {
    method: "POST",
    body: JSON.stringify({
      user_id: "00000000-0000-0000-0000-000000000000",
      amount: 10,
      customer_email: "not-an-email",
      line_items: [{ description: "x", quantity: 1, unit_price: 10, total: 10 }],
    }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("generate-invoice: 400 on invalid JSON", async () => {
  const res = await callFn("generate-invoice", { method: "POST", body: "{not json" });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "INVALID_JSON");
});

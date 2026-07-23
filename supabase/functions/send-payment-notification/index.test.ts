import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("send-payment-notification: 400 on empty body", async () => {
  const res = await callFn("send-payment-notification", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("send-payment-notification: 400 on invalid type", async () => {
  const res = await callFn("send-payment-notification", {
    method: "POST",
    body: JSON.stringify({ type: "maybe", userEmail: "a@b.co", packageName: "P", amount: 1 }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

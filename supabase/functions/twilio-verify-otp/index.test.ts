// Integration tests for twilio-verify-otp.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("twilio-verify-otp: 400 on missing code", async () => {
  const res = await callFn("twilio-verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone: "+8801234567890" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("twilio-verify-otp: 400 on non-numeric code", async () => {
  const res = await callFn("twilio-verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone: "+8801234567890", code: "abcd" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

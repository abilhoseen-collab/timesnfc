// Integration tests for twilio-send-otp.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("twilio-send-otp: 400 on missing phone", async () => {
  const res = await callFn("twilio-send-otp", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("twilio-send-otp: 400 on invalid phone characters", async () => {
  const res = await callFn("twilio-send-otp", {
    method: "POST",
    body: JSON.stringify({ phone: "abc-def-ghij", channel: "sms" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

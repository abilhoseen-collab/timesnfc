// Integration tests for send-notification.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("send-notification: 400 on empty body", async () => {
  const res = await callFn("send-notification", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("send-notification: 400 on invalid event_type", async () => {
  const res = await callFn("send-notification", {
    method: "POST",
    body: JSON.stringify({
      vcard_id: "00000000-0000-0000-0000-000000000000",
      event_type: "explode",
    }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("send-notification: 404 for unknown vcard", async () => {
  const res = await callFn("send-notification", {
    method: "POST",
    body: JSON.stringify({
      vcard_id: "00000000-0000-0000-0000-000000000000",
      event_type: "view",
    }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 404);
  assertEquals(body.code, "VCARD_NOT_FOUND");
});

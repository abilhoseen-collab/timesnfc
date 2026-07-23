import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("send-web-push: 400 when no user_id and no test", async () => {
  const res = await callFn("send-web-push", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "MISSING_USER_ID");
});

Deno.test("send-web-push: 400 on invalid user_id", async () => {
  const res = await callFn("send-web-push", {
    method: "POST",
    body: JSON.stringify({ user_id: "not-uuid" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("send-web-push: 200 no subscriptions for unknown user", async () => {
  const res = await callFn("send-web-push", {
    method: "POST",
    body: JSON.stringify({ user_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 200);
  assertEquals(body.success, false);
});

// Integration tests for send-team-invitation.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("send-team-invitation: 400 on missing fields", async () => {
  const res = await callFn("send-team-invitation", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("send-team-invitation: 400 on invalid email", async () => {
  const res = await callFn("send-team-invitation", {
    method: "POST",
    body: JSON.stringify({
      invitationId: "00000000-0000-0000-0000-000000000000",
      email: "not-email",
      role: "editor",
      token: "sometoken1234567890",
    }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

// Integration tests for delete-user-account.
// - Unauthenticated → 401
// - Missing Bearer prefix → 401
// Note: destructive success path is not exercised in CI to protect real users.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("delete-user-account: rejects request without Authorization", async () => {
  const res = await callFn("delete-user-account", { method: "POST", auth: null });
  const body = await jsonOf(res);
  assertEquals(res.status, 401);
  assertEquals(body.code, "UNAUTHORIZED");
});

Deno.test("delete-user-account: rejects invalid Bearer token", async () => {
  const res = await callFn("delete-user-account", {
    method: "POST",
    auth: "definitely-not-a-real-jwt",
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 401);
  assertEquals(body.code, "UNAUTHORIZED");
});

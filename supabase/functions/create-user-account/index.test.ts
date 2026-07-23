// Integration tests for create-user-account.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("create-user-account: 400 on empty body", async () => {
  const res = await callFn("create-user-account", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("create-user-account: 400 on invalid email", async () => {
  const res = await callFn("create-user-account", {
    method: "POST",
    body: JSON.stringify({
      email: "not-an-email",
      fullName: "T",
      packageName: "Basic",
      amount: 100,
      subscriptionId: "00000000-0000-0000-0000-000000000000",
    }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("create-user-account: 400 on invalid JSON", async () => {
  const res = await callFn("create-user-account", { method: "POST", body: "{bad" });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "INVALID_JSON");
});

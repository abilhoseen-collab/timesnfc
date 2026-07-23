// Integration tests for appointment-reminders.
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("appointment-reminders: GET returns summary", async () => {
  const res = await callFn("appointment-reminders", { method: "GET" });
  const body = await jsonOf(res);
  assertEquals(res.status, 200);
  assertExists(body.checked);
});

Deno.test("appointment-reminders: OPTIONS is 200", async () => {
  const res = await callFn("appointment-reminders", { method: "OPTIONS" });
  assertEquals(res.status, 200);
  await res.text();
});

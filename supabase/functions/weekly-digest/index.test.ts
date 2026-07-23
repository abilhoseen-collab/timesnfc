import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("weekly-digest: GET returns summary", async () => {
  const res = await callFn("weekly-digest", { method: "GET" });
  const body = await jsonOf(res);
  assertEquals(res.status, 200);
  assertExists(body);
});

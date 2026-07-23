// Integration tests for enhance-image.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("enhance-image: 400 on missing imageBase64", async () => {
  const res = await callFn("enhance-image", { method: "POST", body: JSON.stringify({}) });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("enhance-image: 400 on empty imageBase64", async () => {
  const res = await callFn("enhance-image", {
    method: "POST",
    body: JSON.stringify({ imageBase64: "" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

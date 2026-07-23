// Integration tests for dispatch-integrations.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callFn, jsonOf } from "../_shared/testing.ts";

Deno.test("dispatch-integrations: 400 on missing type", async () => {
  const res = await callFn("dispatch-integrations", {
    method: "POST",
    body: JSON.stringify({ vcard_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("dispatch-integrations: 400 on invalid type enum", async () => {
  const res = await callFn("dispatch-integrations", {
    method: "POST",
    body: JSON.stringify({
      vcard_id: "00000000-0000-0000-0000-000000000000",
      type: "spam",
      payload: {},
    }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 400);
  assertEquals(body.code, "VALIDATION_ERROR");
});

Deno.test("dispatch-integrations: 404 for unknown vcard", async () => {
  const res = await callFn("dispatch-integrations", {
    method: "POST",
    body: JSON.stringify({
      vcard_id: "00000000-0000-0000-0000-000000000000",
      type: "lead",
      payload: {},
    }),
  });
  const body = await jsonOf(res);
  assertEquals(res.status, 404);
  assertEquals(body.code, "NOT_FOUND");
});

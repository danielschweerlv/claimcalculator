import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hashIp } from "./rate-limit.ts";

Deno.test("hashIp produces a stable 64-char hex string", async () => {
  const h1 = await hashIp("203.0.113.5", "pepper");
  const h2 = await hashIp("203.0.113.5", "pepper");
  assertEquals(h1, h2);
  assertEquals(h1.length, 64);
  assert(/^[0-9a-f]{64}$/.test(h1));
});

Deno.test("hashIp changes with different peppers", async () => {
  const h1 = await hashIp("203.0.113.5", "pepper-a");
  const h2 = await hashIp("203.0.113.5", "pepper-b");
  assert(h1 !== h2);
});

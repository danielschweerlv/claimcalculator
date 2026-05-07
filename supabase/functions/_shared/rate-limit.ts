import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const HOURLY_LIMIT = 5;
const DAILY_LIMIT = 20;

export async function hashIp(ip: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${pepper}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type RateLimitCheck =
  | { ok: true }
  | { ok: false; reason: "hourly" | "daily" };

export async function checkAndRecord(
  supabase: SupabaseClient,
  ipHash: string,
): Promise<RateLimitCheck> {
  const now = Date.now();
  const hourAgo = new Date(now - HOUR_MS).toISOString();
  const dayAgo = new Date(now - DAY_MS).toISOString();

  // Count attempts in the last hour and last day.
  const [
    { count: hourlyCount, error: hourlyErr },
    { count: dailyCount, error: dailyErr },
  ] = await Promise.all([
    supabase
      .from("rate_limits")
      .select("ip_hash", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", hourAgo),
    supabase
      .from("rate_limits")
      .select("ip_hash", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", dayAgo),
  ]);

  if (hourlyErr || dailyErr) {
    // Fail-open on DB errors — don't block real users because of infra hiccups.
    return { ok: true };
  }
  if ((hourlyCount ?? 0) >= HOURLY_LIMIT) {
    return { ok: false, reason: "hourly" };
  }
  if ((dailyCount ?? 0) >= DAILY_LIMIT) return { ok: false, reason: "daily" };

  // Record this attempt.
  await supabase.from("rate_limits").insert({ ip_hash: ipHash });

  // Opportunistic cleanup of entries older than 24h.
  await supabase.from("rate_limits").delete().lt("created_at", dayAgo);

  return { ok: true };
}

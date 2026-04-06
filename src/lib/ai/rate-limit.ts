import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "./client";

/**
 * Check whether a tenant has remaining AI quota for the current calendar month.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export async function checkAIRateLimit(
  tenantId: string,
  plan: string
): Promise<{ allowed: boolean; reason?: string }> {
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;
  if (limit === Infinity) return { allowed: true };

  const service = createServiceClient();
  const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const { data, error } = await service
    .from("tenant_ai_usage")
    .select("call_count")
    .eq("tenant_id", tenantId)
    .eq("month", month)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found — that's fine
    console.error("AI rate limit check error:", error.message);
  }

  const used = data?.call_count ?? 0;
  if (used >= limit) {
    return {
      allowed: false,
      reason:  `Monthly AI limit reached (${used}/${limit}). Upgrade your plan for more.`,
    };
  }

  return { allowed: true };
}

/**
 * Increment the AI usage counter for the current month.
 * Uses a read-then-upsert pattern (no RPC required).
 * Non-fatal: swallows errors so a tracking failure never blocks the AI response.
 */
export async function incrementAIUsage(tenantId: string): Promise<void> {
  try {
    const service = createServiceClient();
    const month = new Date().toISOString().slice(0, 7);

    const { data } = await service
      .from("tenant_ai_usage")
      .select("call_count")
      .eq("tenant_id", tenantId)
      .eq("month", month)
      .single();

    const nextCount = (data?.call_count ?? 0) + 1;

    await service
      .from("tenant_ai_usage")
      .upsert(
        { tenant_id: tenantId, month, call_count: nextCount, updated_at: new Date().toISOString() },
        { onConflict: "tenant_id,month" }
      );
  } catch {
    // Non-fatal — usage tracking failure must never block the AI response
  }
}

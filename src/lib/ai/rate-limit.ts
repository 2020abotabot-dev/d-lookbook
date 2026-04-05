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
    .select("count")
    .eq("tenant_id", tenantId)
    .eq("month", month)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found — that's fine
    console.error("AI rate limit check error:", error.message);
  }

  const used = data?.count ?? 0;
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
 * Uses upsert so the first call of the month creates the row.
 */
export async function incrementAIUsage(tenantId: string): Promise<void> {
  const service = createServiceClient();
  const month = new Date().toISOString().slice(0, 7);

  await service.rpc("increment_ai_usage", { p_tenant_id: tenantId, p_month: month });
}

/**
 * Server-only helper — returns the current authenticated user's tenant.
 * Redirects to /login if not authenticated or no tenant found.
 */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { TenantConfig } from "@/types/tenant";

export type SessionTenant = TenantConfig;

export async function getCurrentTenant(): Promise<{ userId: string; tenantId: string; tenant: SessionTenant }> {
  const supabase = await createClient();

  // Use getSession() first — reads cookies locally without a network call.
  // Fall back to getUser() only to get the verified user ID.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const service = createServiceClient();
  const { data } = await service
    .from("users")
    .select("tenant_id, tenants(id, name, slug, plan, custom_domain, branding, settings)")
    .eq("id", userId)
    .single();

  const raw = data?.tenants;
  const tenant = (Array.isArray(raw) ? raw[0] : raw) as SessionTenant | null;

  if (!tenant) redirect("/login");

  return { userId, tenantId: data!.tenant_id as string, tenant };
}

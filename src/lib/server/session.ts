/**
 * Server-only helper — returns the current authenticated user's tenant.
 * Redirects to /login if not authenticated.
 */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { TenantConfig } from "@/types/tenant";

export type SessionTenant = TenantConfig;

export async function getCurrentTenant(): Promise<{ userId: string; tenantId: string; tenant: SessionTenant }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const { data } = await service
    .from("users")
    .select("tenant_id, tenants(id, name, slug, plan, custom_domain, branding, settings)")
    .eq("id", user.id)
    .single();

  const raw = data?.tenants;
  const tenant = (Array.isArray(raw) ? raw[0] : raw) as SessionTenant | null;

  if (!tenant) redirect("/login");

  return { userId: user.id, tenantId: data!.tenant_id as string, tenant };
}

"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TEST_MODE } from "@/lib/test-mode";
import type { TenantBranding } from "@/types/tenant";

export async function saveBranding(
  tenantId: string,
  branding: TenantBranding
): Promise<{ success: boolean; error?: string }> {
  if (TEST_MODE) {
    // No-op in test mode — UI handles optimistic state
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthenticated" };

  const service = createServiceClient();
  const { error } = await service
    .from("tenants")
    .update({ branding, updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function saveCustomDomain(
  tenantId: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  if (TEST_MODE) return { success: true };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthenticated" };

  const service = createServiceClient();
  const { error } = await service
    .from("tenants")
    .update({ custom_domain: domain || null, updated_at: new Date().toISOString() })
    .eq("id", tenantId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function inviteTeamMember(
  tenantId: string,
  email: string,
  role: "admin" | "editor" | "viewer"
): Promise<{ success: boolean; error?: string }> {
  if (TEST_MODE) return { success: true };

  const service = createServiceClient();

  // Use Supabase Admin to send invite email
  const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
    data: { tenant_id: tenantId, role },
    redirectTo: `${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN}/auth/callback`,
  });

  if (error) return { success: false, error: error.message };

  // Create pending user record
  await service.from("users").insert({
    id:        data.user.id,
    tenant_id: tenantId,
    email,
    full_name: "",
    role,
  });

  return { success: true };
}

export async function removeTeamMember(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (TEST_MODE) return { success: true };

  const service = createServiceClient();
  const { error } = await service
    .from("users")
    .delete()
    .eq("id", userId)
    .eq("tenant_id", tenantId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

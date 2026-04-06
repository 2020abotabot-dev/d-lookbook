"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TEST_MODE } from "@/lib/test-mode";
import { redirect } from "next/navigation";
import type { LookbookConfig, LookbookSection } from "@/types/lookbook";

export async function createLookbook(
  tenantId: string,
  templateId: string,
  title: string
): Promise<{ id?: string; error?: string }> {
  if (TEST_MODE) {
    return { id: `test-lb-${Date.now()}` };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const service = createServiceClient();
  const { data, error } = await service
    .from("lookbooks")
    .insert({
      tenant_id:   tenantId,
      title,
      description: "",
      template_id: templateId,
      config:      { template_id: templateId, filter: { enabled: true } } as LookbookConfig,
      status:      "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function createLookbookAndRedirect(
  tenantId: string,
  templateId: string,
  title: string
): Promise<void> {
  const { id, error } = await createLookbook(tenantId, templateId, title);
  if (error) redirect(`/builder/new?error=${encodeURIComponent(error)}`);
  redirect(`/builder/${id}/edit`);
}

export async function updateLookbookConfig(
  id: string,
  tenantId: string,
  config: Partial<LookbookConfig> & { title?: string; description?: string }
): Promise<{ error?: string }> {
  if (TEST_MODE) return {};

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const service = createServiceClient();
  const { title, description, ...configRest } = config;
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (Object.keys(configRest).length > 0) update.config = configRest;

  const { error } = await service
    .from("lookbooks")
    .update(update)
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };
  return {};
}

export async function upsertSection(
  section: Omit<LookbookSection, "created_at">
): Promise<{ id?: string; error?: string }> {
  if (TEST_MODE) return { id: section.id };

  const service = createServiceClient();
  const { data, error } = await service
    .from("lookbook_sections")
    .upsert(section, { onConflict: "id" })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data?.id ?? section.id };
}

export async function deleteSection(id: string): Promise<{ error?: string }> {
  if (TEST_MODE) return {};

  const service = createServiceClient();
  const { error } = await service.from("lookbook_sections").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function reorderSections(
  lookbookId: string,
  orderedIds: string[]
): Promise<{ error?: string }> {
  if (TEST_MODE) return {};

  const service = createServiceClient();
  await Promise.all(
    orderedIds.map((id, i) =>
      service
        .from("lookbook_sections")
        .update({ sort_order: i })
        .eq("id", id)
        .eq("lookbook_id", lookbookId)
    )
  );
  return {};
}

export async function assignProduct(
  lookbookId: string,
  productId: string,
  tenantId: string,
  section: string,
  position: number,
  featured = false
): Promise<{ error?: string }> {
  if (TEST_MODE) return {};

  const service = createServiceClient();
  const { error } = await service
    .from("lookbook_products")
    .upsert(
      { lookbook_id: lookbookId, product_id: productId, tenant_id: tenantId, section, position, featured },
      { onConflict: "lookbook_id,product_id" }
    );

  if (error) return { error: error.message };
  return {};
}

export async function removeProduct(
  lookbookId: string,
  productId: string
): Promise<{ error?: string }> {
  if (TEST_MODE) return {};

  const service = createServiceClient();
  const { error } = await service
    .from("lookbook_products")
    .delete()
    .eq("lookbook_id", lookbookId)
    .eq("product_id", productId);

  if (error) return { error: error.message };
  return {};
}

export async function reorderProducts(
  lookbookId: string,
  section: string,
  orderedProductIds: string[]
): Promise<{ error?: string }> {
  if (TEST_MODE) return {};

  const service = createServiceClient();
  await Promise.all(
    orderedProductIds.map((productId, i) =>
      service
        .from("lookbook_products")
        .update({ position: i })
        .eq("lookbook_id", lookbookId)
        .eq("product_id", productId)
        .eq("section", section)
    )
  );
  return {};
}

export async function publishLookbook(
  id: string,
  tenantId: string,
  tenantSlug: string
): Promise<{ url?: string; error?: string }> {
  if (TEST_MODE) {
    return { url: `https://${tenantSlug}.dlookbook.com/lookbook/${id}` };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const service = createServiceClient();
  const publishedUrl = `https://${tenantSlug}.dlookbook.com/lookbook/${id}`;

  const { error } = await service
    .from("lookbooks")
    .update({
      status:        "published",
      published_at:  new Date().toISOString(),
      published_url: publishedUrl,
      updated_at:    new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };

  // Trigger ISR revalidation for the tenant's public lookbook page
  const revalidateSecret = process.env.REVALIDATE_SECRET ?? "dev-revalidate-secret";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    await fetch(`${baseUrl}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret:     revalidateSecret,
        path:       `/${tenantSlug}`,
        tenantSlug,
      }),
    });
  } catch {
    // Non-fatal — ISR will revalidate on the next request after stale TTL
  }

  return { url: publishedUrl };
}

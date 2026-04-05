"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TEST_MODE } from "@/lib/test-mode";
import { redirect } from "next/navigation";
import type { DbProduct } from "@/types/database";

type ProductInput = Omit<DbProduct, "id" | "tenant_id" | "created_at" | "updated_at">;

export async function createProduct(
  tenantId: string,
  input: ProductInput
): Promise<{ id?: string; error?: string }> {
  if (TEST_MODE) {
    // Return a fake ID for test mode redirect
    return { id: `test-${Date.now()}` };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const service = createServiceClient();
  const { data, error } = await service
    .from("products")
    .insert({ ...input, tenant_id: tenantId })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateProduct(
  id: string,
  tenantId: string,
  input: Partial<ProductInput>
): Promise<{ error?: string }> {
  if (TEST_MODE) return {};

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const service = createServiceClient();
  const { error } = await service
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };
  return {};
}

export async function archiveProduct(
  id: string,
  tenantId: string
): Promise<{ error?: string }> {
  return updateProduct(id, tenantId, { status: "archived" });
}

export interface ImportRow {
  name: string;
  sku: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  status?: "draft" | "active" | "archived";
}

export async function importProducts(
  tenantId: string,
  rows: ImportRow[]
): Promise<{ imported: number; errors: string[] }> {
  if (TEST_MODE) {
    return { imported: rows.length, errors: [] };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { imported: 0, errors: ["Unauthenticated"] };

  const service = createServiceClient();
  const errors: string[] = [];
  let imported = 0;

  // Batch upsert in chunks of 100
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK).map((r, idx) => ({
      tenant_id:   tenantId,
      name:        r.name,
      sku:         r.sku,
      description: r.description ?? "",
      price:       r.price ?? 0,
      currency:    r.currency ?? "EUR",
      category:    r.category ?? "",
      subcategory: r.subcategory ?? null,
      images:      [] as string[],
      specs:       {} as Record<string, unknown>,
      tags:        r.tags ?? [],
      status:      r.status ?? "draft",
      sort_order:  i + idx,
    }));

    const { data: upserted, error } = await service
      .from("products")
      .upsert(chunk, { onConflict: "tenant_id,sku", ignoreDuplicates: false })
      .select("id");

    if (error) {
      errors.push(`Chunk ${i / CHUNK + 1}: ${error.message}`);
    } else {
      imported += upserted?.length ?? chunk.length;
    }
  }

  return { imported, errors };
}

export async function createProductAndRedirect(formData: FormData): Promise<void> {
  const tenantId = formData.get("tenant_id") as string;

  const input: ProductInput = {
    name:        formData.get("name") as string,
    sku:         formData.get("sku") as string,
    description: formData.get("description") as string ?? "",
    price:       parseFloat(formData.get("price") as string ?? "0"),
    currency:    formData.get("currency") as string ?? "EUR",
    category:    formData.get("category") as string ?? "",
    subcategory: (formData.get("subcategory") as string) || null,
    images:      [],
    specs:       JSON.parse((formData.get("specs") as string) ?? "{}"),
    tags:        ((formData.get("tags") as string) ?? "").split(",").map(t => t.trim()).filter(Boolean),
    status:      (formData.get("status") as "draft" | "active") ?? "draft",
    sort_order:  0,
  };

  const { id, error } = await createProduct(tenantId, input);
  if (error) redirect(`/products/new?error=${encodeURIComponent(error)}`);
  redirect(`/products/${id}/edit?created=1`);
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TEST_MODE } from "@/lib/test-mode";
import {
  MOCK_TENANT, MOCK_LOOKBOOKS, MOCK_SECTIONS,
  MOCK_LOOKBOOK_PRODUCTS, MOCK_PRODUCTS,
} from "@/lib/mock/data";
import LookbookRenderer from "@/components/lookbook/LookbookRenderer";
import { createServiceClient } from "@/lib/supabase/server";
import type { DbTenant, DbLookbook, DbLookbookSection, DbLookbookProduct, DbProduct } from "@/types/database";
import type { TenantConfig } from "@/types/tenant";

export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (TEST_MODE) {
    const lb = MOCK_LOOKBOOKS.find(l => l.id === id) ?? MOCK_LOOKBOOKS[0];
    return { title: `${lb.title} — ${MOCK_TENANT.name}` };
  }
  const service = createServiceClient();
  const { data } = await service.from("lookbooks").select("title").eq("id", id).single();
  return { title: data?.title ?? "Lookbook" };
}

export default async function SpecificLookbookPage({ params }: Props) {
  const { slug, id } = await params;

  if (TEST_MODE) {
    const lookbook = MOCK_LOOKBOOKS.find(l => l.id === id) ?? MOCK_LOOKBOOKS[0];
    return (
      <LookbookRenderer
        tenant={MOCK_TENANT}
        lookbook={lookbook}
        sections={MOCK_SECTIONS.filter(s => s.lookbook_id === lookbook.id)}
        assignments={MOCK_LOOKBOOK_PRODUCTS.filter(lp => lp.lookbook_id === lookbook.id)}
        products={MOCK_PRODUCTS}
      />
    );
  }

  const service = createServiceClient();

  const { data: tenantRow } = await service
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single<DbTenant>();

  if (!tenantRow) return notFound();

  const { data: lookbookRow } = await service
    .from("lookbooks")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantRow.id)
    .eq("status", "published")
    .single<DbLookbook>();

  if (!lookbookRow) return notFound();

  const { data: sectionRows } = await service
    .from("lookbook_sections")
    .select("*")
    .eq("lookbook_id", id)
    .order("sort_order");

  const { data: assignmentRows } = await service
    .from("lookbook_products")
    .select("*")
    .eq("lookbook_id", id);

  const productIds = [...new Set((assignmentRows ?? []).map(a => a.product_id))];
  const { data: productRows } = productIds.length
    ? await service.from("products").select("*").in("id", productIds)
    : { data: [] as DbProduct[] };

  const tenant: TenantConfig = {
    id:            tenantRow.id,
    slug:          tenantRow.slug,
    name:          tenantRow.name,
    custom_domain: tenantRow.custom_domain,
    plan:          tenantRow.plan,
    branding:      tenantRow.branding,
    settings:      tenantRow.settings,
  };

  return (
    <LookbookRenderer
      tenant={tenant}
      lookbook={lookbookRow}
      sections={(sectionRows ?? []) as DbLookbookSection[]}
      assignments={(assignmentRows ?? []) as DbLookbookProduct[]}
      products={(productRows ?? []) as DbProduct[]}
    />
  );
}

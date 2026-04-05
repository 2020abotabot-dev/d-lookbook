import { notFound } from "next/navigation";
import { headers } from "next/headers";
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

// ── ISR — statically generated, revalidates every hour (or on-demand publish) ─
export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (TEST_MODE) {
    return {
      title: `${MOCK_TENANT.name} — ${MOCK_LOOKBOOKS[0].title}`,
      description: MOCK_LOOKBOOKS[0].description,
    };
  }

  const service = createServiceClient();
  const { data: tenant } = await service
    .from("tenants")
    .select("name, branding")
    .eq("slug", slug)
    .single();

  if (!tenant) return { title: "Lookbook" };

  return {
    title: tenant.name,
    description: `${tenant.name} digital lookbook`,
    openGraph: {
      type: "website",
    },
  };
}

export async function generateStaticParams() {
  if (TEST_MODE) return [{ slug: "demo-brand" }];

  const service = createServiceClient();
  const { data } = await service
    .from("tenants")
    .select("slug")
    .not("slug", "is", null);

  return (data ?? []).map(t => ({ slug: t.slug }));
}

export default async function PublicLookbookPage({ params }: Props) {
  const { slug } = await params;

  // ── Test mode: serve mock data ──────────────────────────────────────────
  if (TEST_MODE) {
    const lookbook = MOCK_LOOKBOOKS.find(l => l.status === "published") ?? MOCK_LOOKBOOKS[0];
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

  // ── Production: resolve tenant → most-recently published lookbook ───────
  const service = createServiceClient();

  // Check if the request came via subdomain middleware (x-tenant-slug header)
  const hdrs = await headers();
  const headerSlug = hdrs.get("x-tenant-slug");
  const resolvedSlug = headerSlug ?? slug;

  const { data: tenantRow } = await service
    .from("tenants")
    .select("*")
    .eq("slug", resolvedSlug)
    .single<DbTenant>();

  if (!tenantRow) return notFound();

  const { data: lookbookRow } = await service
    .from("lookbooks")
    .select("*")
    .eq("tenant_id", tenantRow.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .single<DbLookbook>();

  if (!lookbookRow) return notFound();

  const { data: sectionRows } = await service
    .from("lookbook_sections")
    .select("*")
    .eq("lookbook_id", lookbookRow.id)
    .order("sort_order");

  const { data: assignmentRows } = await service
    .from("lookbook_products")
    .select("*")
    .eq("lookbook_id", lookbookRow.id);

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

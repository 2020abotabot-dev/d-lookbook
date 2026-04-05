import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/server/session";
import EditLookbookClient from "@/components/admin/lookbook/EditLookbookClient";
import type { DbLookbook, DbLookbookSection, DbLookbookProduct, DbProduct } from "@/types/database";

export const metadata = { title: "Edit Lookbook — DLookBook" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLookbookPage({ params }: Props) {
  const { id } = await params;
  const { tenantId, tenant } = await getCurrentTenant();
  const service = createServiceClient();

  const [lbRes, sectRes, assignRes, prodRes] = await Promise.all([
    service.from("lookbooks").select("*").eq("id", id).eq("tenant_id", tenantId).single(),
    service.from("lookbook_sections").select("*").eq("lookbook_id", id).eq("tenant_id", tenantId).order("sort_order"),
    service.from("lookbook_products").select("*").eq("lookbook_id", id).eq("tenant_id", tenantId).order("position"),
    service.from("products").select("*").eq("tenant_id", tenantId).neq("status", "archived").order("sort_order"),
  ]);

  if (!lbRes.data) notFound();

  return (
    <EditLookbookClient
      lookbookId={id}
      lookbook={lbRes.data as DbLookbook}
      sections={(sectRes.data ?? []) as DbLookbookSection[]}
      assignments={(assignRes.data ?? []) as DbLookbookProduct[]}
      products={(prodRes.data ?? []) as DbProduct[]}
      tenant={tenant}
    />
  );
}

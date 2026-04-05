import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/server/session";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ImportTabs from "@/components/admin/products/ImportTabs";
import type { DbProduct } from "@/types/database";

export const metadata = { title: "Import Products — DLookBook" };

export default async function ImportProductsPage() {
  const { tenantId } = await getCurrentTenant();
  const service = createServiceClient();

  const { data } = await service
    .from("products")
    .select("id, name, sku, category")
    .eq("tenant_id", tenantId)
    .order("name");

  const products = (data ?? []) as Pick<DbProduct, "id" | "name" | "sku" | "category">[];

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: "Import" }]} />
          <h1 className="platform-page__title">Import products</h1>
          <p className="platform-page__sub">Bulk add products from a CSV, Excel, or folder</p>
        </div>
      </div>

      <ImportTabs tenantId={tenantId} products={products as DbProduct[]} />
    </div>
  );
}

import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/server/session";
import ProductTable from "@/components/admin/products/ProductTable";
import type { DbProduct } from "@/types/database";

export const metadata = { title: "Products — DLookBook" };

export default async function ProductsPage() {
  const { tenantId } = await getCurrentTenant();
  const service = createServiceClient();

  const { data: products } = await service
    .from("products")
    .select("*")
    .eq("tenant_id", tenantId)
    .neq("status", "archived")
    .order("sort_order", { ascending: true });

  const rows = (products ?? []) as DbProduct[];
  const categories = [...new Set(rows.map(p => p.category).filter(Boolean))];

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <h1 className="platform-page__title">Products</h1>
          <p className="platform-page__sub">{rows.length} product{rows.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <ProductTable
        products={rows}
        tenantId={tenantId}
        categories={categories}
      />
    </div>
  );
}

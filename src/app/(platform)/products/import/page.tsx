import { MOCK_PRODUCTS, MOCK_TENANT } from "@/lib/mock/data";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ImportTabs from "@/components/admin/products/ImportTabs";

export const metadata = { title: "Import Products — DLookBook" };

export default async function ImportProductsPage() {
  const tenantId = MOCK_TENANT.id; // TODO: real tenant from session
  const products = MOCK_PRODUCTS;  // TODO: fetch from Supabase

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: "Import" }]} />
          <h1 className="platform-page__title">Import products</h1>
          <p className="platform-page__sub">Bulk add products from a CSV, Excel, or folder</p>
        </div>
      </div>

      <ImportTabs tenantId={tenantId} products={products} />
    </div>
  );
}

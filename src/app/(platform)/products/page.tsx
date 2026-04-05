import { MOCK_PRODUCTS, MOCK_TENANT, MOCK_CATEGORIES } from "@/lib/mock/data";
import ProductTable from "@/components/admin/products/ProductTable";

export const metadata = { title: "Products — DLookBook" };

export default async function ProductsPage() {
  // TODO: fetch from Supabase when !TEST_MODE
  const products   = MOCK_PRODUCTS;
  const tenantId   = MOCK_TENANT.id;
  const categories = MOCK_CATEGORIES;

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <h1 className="platform-page__title">Products</h1>
          <p className="platform-page__sub">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <ProductTable
        products={products}
        tenantId={tenantId}
        categories={categories}
      />
    </div>
  );
}

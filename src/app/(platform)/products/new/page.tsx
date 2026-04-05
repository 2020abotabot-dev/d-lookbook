import { getCurrentTenant } from "@/lib/server/session";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductForm from "@/components/admin/products/ProductForm";

export const metadata = { title: "Add Product — DLookBook" };

export default async function NewProductPage() {
  const { tenantId } = await getCurrentTenant();

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: "Add product" }]} />
          <h1 className="platform-page__title">Add product</h1>
        </div>
      </div>
      <ProductForm tenantId={tenantId} />
    </div>
  );
}

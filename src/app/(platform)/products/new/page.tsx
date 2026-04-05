import { MOCK_TENANT } from "@/lib/mock/data";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductForm from "@/components/admin/products/ProductForm";

export const metadata = { title: "Add Product — DLookBook" };

export default function NewProductPage() {
  const tenantId = MOCK_TENANT.id; // TODO: real tenant from session

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

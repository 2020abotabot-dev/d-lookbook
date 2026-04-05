import { notFound } from "next/navigation";
import { MOCK_PRODUCTS, MOCK_TENANT } from "@/lib/mock/data";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductForm from "@/components/admin/products/ProductForm";

export const metadata = { title: "Edit Product — DLookBook" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const tenantId = MOCK_TENANT.id; // TODO: real tenant from session

  // TODO: fetch from Supabase when !TEST_MODE
  const product = MOCK_PRODUCTS.find(p => p.id === id);
  if (!product) notFound();

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Products", href: "/products" }, { label: product.name }]} />
          <h1 className="platform-page__title">Edit product</h1>
        </div>
      </div>
      <ProductForm tenantId={tenantId} product={product} />
    </div>
  );
}

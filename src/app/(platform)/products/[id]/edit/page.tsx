import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/server/session";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductForm from "@/components/admin/products/ProductForm";
import type { DbProduct } from "@/types/database";

export const metadata = { title: "Edit Product — DLookBook" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const { tenantId } = await getCurrentTenant();
  const service = createServiceClient();

  const { data } = await service
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (!data) notFound();
  const product = data as DbProduct;

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

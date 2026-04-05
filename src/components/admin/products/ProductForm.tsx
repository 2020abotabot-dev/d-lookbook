"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DbProduct } from "@/types/database";
import { createProduct, updateProduct } from "@/app/actions/products";
import { TEST_MODE } from "@/lib/test-mode";
import { MOCK_TENANT, MOCK_CATEGORIES } from "@/lib/mock/data";
import { slugify } from "@/lib/utils/slug";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import ImageUploader from "./ImageUploader";
import SpecsEditor from "./SpecsEditor";
import AIWriteButton from "@/components/admin/ai/AIWriteButton";

type ProductStatus = "draft" | "active" | "archived";

interface ProductFormProps {
  tenantId: string;
  product?: DbProduct;
}

export default function ProductForm({ tenantId, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName]             = useState(product?.name ?? "");
  const [sku, setSku]               = useState(product?.sku ?? "");
  const [description, setDesc]      = useState(product?.description ?? "");
  const [price, setPrice]           = useState(String(product?.price ?? ""));
  const [currency, setCurrency]     = useState(product?.currency ?? "EUR");
  const [category, setCategory]     = useState(product?.category ?? "");
  const [subcategory, setSubcat]    = useState(product?.subcategory ?? "");
  const [images, setImages]         = useState<string[]>(product?.images ?? []);
  const [specs, setSpecs]           = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(product?.specs ?? {}).map(([k, v]) => [k, String(v)]))
  );
  const [tags, setTags]             = useState((product?.tags ?? []).join(", "));
  const [status, setStatus]         = useState<ProductStatus>(product?.status ?? "draft");
  const [error, setError]           = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNameBlur() {
    if (!sku && name) setSku(slugify(name).toUpperCase().replace(/-/g, "-"));
  }

  function handleSubmit(nextStatus: ProductStatus) {
    startTransition(async () => {
      setError(null);
      const input = {
        name,
        sku,
        description,
        price: parseFloat(price) || 0,
        currency,
        category,
        subcategory: subcategory || null,
        images,
        specs: specs as Record<string, unknown>,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        status: nextStatus,
        sort_order: product?.sort_order ?? 0,
      };

      if (isEdit) {
        const result = await updateProduct(product!.id, tenantId, input);
        if (result.error) { setError(result.error); return; }
        router.push("/products");
      } else {
        const result = await createProduct(tenantId, input);
        if (result.error) { setError(result.error); return; }
        router.push(TEST_MODE ? "/products" : `/products/${result.id}/edit?created=1`);
      }
    });
  }

  return (
    <form className="product-form" onSubmit={e => e.preventDefault()}>
      <div className="product-form__grid">
        <div className="product-form__main">
          <section className="settings-section">
            <h2 className="settings-section__title">Basic info</h2>
            <div className="settings-form">
              <label className="settings-label">
                Product name *
                <input
                  className="settings-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  required
                />
              </label>
              <label className="settings-label">
                SKU *
                <input
                  className="settings-input"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  required
                />
              </label>
              <div className="settings-label">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span>Description</span>
                  <AIWriteButton
                    tenantId={tenantId}
                    productName={name}
                    category={category}
                    features={Object.values(specs).filter(Boolean)}
                    onApply={copy => setDesc(copy.long)}
                  />
                </div>
                <MarkdownEditor value={description} onChange={setDesc} />
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-section__title">Pricing</h2>
            <div className="product-form__price-row">
              <label className="settings-label" style={{ flex: 1 }}>
                Price
                <input
                  type="number"
                  className="settings-input"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </label>
              <label className="settings-label" style={{ width: 100 }}>
                Currency
                <select className="settings-input" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option>EUR</option>
                  <option>USD</option>
                  <option>GBP</option>
                  <option>SEK</option>
                </select>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-section__title">Organisation</h2>
            <div className="settings-form">
              <label className="settings-label">
                Category
                <input
                  className="settings-input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  list="category-list"
                />
                <datalist id="category-list">
                  {MOCK_CATEGORIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </label>
              <label className="settings-label">
                Subcategory
                <input
                  className="settings-input"
                  value={subcategory}
                  onChange={e => setSubcat(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="settings-label">
                Tags
                <input
                  className="settings-input"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="trail, running, waterproof"
                />
                <span className="field-hint">Comma-separated</span>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-section__title">Specs</h2>
            <SpecsEditor value={specs} onChange={setSpecs} />
          </section>
        </div>

        <div className="product-form__side">
          <section className="settings-section">
            <h2 className="settings-section__title">Images</h2>
            <ImageUploader value={images} onChange={setImages} />
          </section>

          <section className="settings-section">
            <h2 className="settings-section__title">Status</h2>
            <div className="settings-form">
              <select
                className="settings-input"
                value={status}
                onChange={e => setStatus(e.target.value as ProductStatus)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </section>

          {error && <p className="form-error">{error}</p>}

          <div className="product-form__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => handleSubmit("draft")}
              disabled={isPending}
            >
              Save as draft
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => handleSubmit("active")}
              disabled={isPending}
            >
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

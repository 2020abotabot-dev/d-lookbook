"use client";

import { useRef } from "react";
import { useScrollReveal } from "@/components/hooks/useScrollReveal";
import { useLookbookFilter } from "@/lib/lookbook-filter-context";
import ProductCard from "@/components/lookbook/ProductCard";
import type { TemplateDefinition } from "@/lib/templates/types";
import type { DbProduct, DbLookbookSection, DbLookbookProduct } from "@/types/database";

interface ProductGridSectionProps {
  section: DbLookbookSection;
  assignments: DbLookbookProduct[];
  allProducts: DbProduct[];
  template: TemplateDefinition;
  tenantId: string;
  lookbookId: string;
  onProductClick: (product: DbProduct) => void;
}

export default function ProductGridSection({
  section,
  assignments,
  allProducts,
  template,
  onProductClick,
}: ProductGridSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useScrollReveal(sectionRef, { threshold: 0.05 });

  const { isVisible } = useLookbookFilter();

  const cfg = section.config as {
    layout?: string;
    filter_enabled?: boolean;
  };
  const layoutKey = cfg.layout ?? template.defaultGridLayout;

  // Resolve products for this section in position order
  const sectionAssignments = assignments
    .filter(a => a.section === section.id)
    .sort((a, b) => a.position - b.position);

  const products = sectionAssignments
    .map(a => allProducts.find(p => p.id === a.product_id))
    .filter((p): p is DbProduct => !!p && isVisible(p));

  if (products.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id={`section-${section.id}`}
      className={`lb-grid-section lb-reveal`}
      style={{ padding: sectionSpacing(template.sectionSpacing) }}
    >
      {/* Section header */}
      {section.title && (
        <div className="lb-section-header">
          <h2 className="lb-section-title" style={{ fontFamily: "var(--brand-font-heading)" }}>
            {section.title}
          </h2>
          {section.description && (
            <p className="lb-section-desc">{section.description}</p>
          )}
        </div>
      )}

      {/* Product grid */}
      <div className={`lb-grid lb-grid--${layoutKey}`}>
        {products.map((product, i) => {
          const assignment = sectionAssignments.find(a => a.product_id === product.id);
          return (
            <div key={product.id} id={`product-${product.id}`}>
              <ProductCard
                product={product}
                featured={assignment?.featured ?? false}
                template={template}
                staggerIndex={i}
                onClick={() => onProductClick(product)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function sectionSpacing(spacing: TemplateDefinition["sectionSpacing"]): string {
  switch (spacing) {
    case "compact":  return "2rem 2rem 1.5rem";
    case "generous": return "6rem 3rem 5rem";
    default:         return "4rem 2.5rem 3rem";
  }
}

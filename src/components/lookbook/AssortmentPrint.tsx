"use client";

// ── AssortmentPrint ────────────────────────────────────────────────────────────
// Renders the print layout when isPrinting is true.
// Uses createPortal to render directly in <body> so the @media print selector
// "body > *:not(.aprint-root)" correctly hides everything else.
// Uses window.print() — no PDF library needed.

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAssortment } from "@/lib/assortment-context";
import { usePrint } from "@/lib/print-context";
import type { TenantConfig } from "@/types/tenant";

interface Props {
  tenant:        TenantConfig;
  lookbookTitle: string;
}

export default function AssortmentPrint({ tenant, lookbookTitle }: Props) {
  const { selections, count }    = useAssortment();
  const { isPrinting, buyerName } = usePrint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;
  if (!isPrinting && count === 0) return null;

  // Group by category
  const byCategory = new Map<string, typeof items>();
  const items = [...selections.values()];
  for (const p of items) {
    const cat = p.category || "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(p);
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return createPortal(
    <div className="aprint-root" aria-hidden={!isPrinting}>
      {/* ── Cover page ─────────────────────────────────────────────────── */}
      <div className="aprint-cover">
        {/* Corner registration marks */}
        <span className="aprint-reg aprint-reg--tl" />
        <span className="aprint-reg aprint-reg--tr" />
        <span className="aprint-reg aprint-reg--bl" />
        <span className="aprint-reg aprint-reg--br" />

        <div className="aprint-cover-top">
          {tenant.branding.logo_url
            ? <img src={tenant.branding.logo_url} alt={tenant.name} className="aprint-cover-logo" />
            : <span className="aprint-cover-brand">{tenant.name}</span>
          }
        </div>

        <div className="aprint-cover-hero">
          <p className="aprint-cover-eyebrow">{lookbookTitle}</p>
          <h1 className="aprint-cover-headline">{tenant.name}</h1>
          <div className="aprint-cover-rule" style={{ background: tenant.branding.accent_color }} />
        </div>

        <div className="aprint-cover-meta">
          <div className="aprint-cover-meta-left">
            <span className="aprint-cover-meta-label">Assortment Selection</span>
            {buyerName && <span className="aprint-cover-meta-value">{buyerName}</span>}
            <span className="aprint-cover-meta-value">{today}</span>
          </div>
          <div className="aprint-cover-meta-right">
            <span className="aprint-cover-meta-count">{count}</span>
            <span className="aprint-cover-meta-label">products selected</span>
          </div>
        </div>
      </div>

      {/* ── Product pages ──────────────────────────────────────────────── */}
      {[...byCategory.entries()].map(([cat, prods]) => (
        <div key={cat} className="aprint-category-page">
          <div className="aprint-page-header">
            <span className="aprint-page-brand">{tenant.name}</span>
            <span className="aprint-page-title">{lookbookTitle}</span>
          </div>

          <div className="aprint-category-label" style={{ color: tenant.branding.accent_color }}>
            {cat}
          </div>
          <div className="aprint-category-rule" style={{ background: tenant.branding.accent_color }} />

          <div className="aprint-product-grid">
            {prods.map(p => {
              const price = new Intl.NumberFormat("en", {
                style: "currency",
                currency: p.currency || "EUR",
                minimumFractionDigits: 0,
              }).format(p.price);

              return (
                <div key={p.id} className="aprint-product-card">
                  <div className="aprint-product-image">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="aprint-product-img" />
                      : <div className="aprint-product-img-placeholder">{p.name[0]}</div>
                    }
                  </div>
                  <div className="aprint-product-info">
                    <p className="aprint-product-name">{p.name}</p>
                    {p.sku && <p className="aprint-product-sku">{p.sku}</p>}
                    <p className="aprint-product-price" style={{ color: tenant.branding.accent_color }}>
                      {price}
                    </p>
                    {p.description && (
                      <p className="aprint-product-desc">
                        {p.description.slice(0, 120)}{p.description.length > 120 ? "…" : ""}
                      </p>
                    )}
                    {p.tags?.length > 0 && (
                      <p className="aprint-product-tags">{p.tags.slice(0, 4).join(" · ")}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Back cover ─────────────────────────────────────────────────── */}
      <div className="aprint-back-cover">
        <span className="aprint-back-brand">{tenant.name}</span>
        <span className="aprint-back-powered">Powered by DLookBook</span>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAssortment } from "@/lib/assortment-context";
import { usePrint } from "@/lib/print-context";
import { useLookbookFilter } from "@/lib/lookbook-filter-context";
import type { DbProduct, DbLookbookSection } from "@/types/database";

interface Props {
  brandName:     string;
  logoUrl?:      string;
  lookbookTitle: string;
  products:      DbProduct[];
  sections:      DbLookbookSection[];
}

export default function HamburgerMenu({ brandName, logoUrl, lookbookTitle, products, sections }: Props) {
  const [open,  setOpen]  = useState(false);
  const [panel, setPanel] = useState<"main" | "products">("main");

  const { count }         = useAssortment();
  const { triggerPrint }  = usePrint();
  const {
    isProductHidden, toggleProductHidden,
    setCategoryHidden, isCategoryFullyHidden, isCategoryPartialHidden,
    hiddenIds, showAll,
  } = useLookbookFilter();

  const [copied, setCopied] = useState(false);

  function handleShareView() {
    // Encode hidden IDs as base64url and append as ?v= param
    const hiddenArr = [...hiddenIds];
    const token = btoa(JSON.stringify(hiddenArr))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = `${window.location.origin}${window.location.pathname}?v=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function close() { setOpen(false); setPanel("main"); }

  // Group products by category
  const byCategory = products.reduce<Record<string, DbProduct[]>>((acc, p) => {
    const cat = p.category || "Other";
    (acc[cat] ||= []).push(p);
    return acc;
  }, {});

  const hiddenCount = hiddenIds.size;

  return (
    <>
      {/* Trigger button */}
      <button
        className={`hm-trigger${open ? " hm-trigger--open" : ""}`}
        onClick={() => { setOpen(o => !o); setPanel("main"); }}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <span className="hm-bar hm-bar--top" />
        <span className="hm-bar hm-bar--mid" />
        <span className="hm-bar hm-bar--bot" />
      </button>

      {/* Overlay */}
      <div className={`hm-overlay${open ? " hm-overlay--open" : ""}`} onClick={close} aria-hidden />

      {/* Menu panel */}
      <div className={`hm-panel${open ? " hm-panel--open" : ""}`} role="dialog" aria-modal aria-label="Navigation">

        {/* ── Main panel ── */}
        <div className={`hm-slide hm-slide--main${panel === "main" ? " hm-slide--active" : ""}`}>
          <div className="hm-header">
            {logoUrl
              ? <img src={logoUrl} alt={brandName} className="hm-logo" />
              : <span className="hm-brand">{brandName}</span>
            }
            <button className="hm-close" onClick={close} aria-label="Close">✕</button>
          </div>

          <nav className="hm-nav">
            <p className="hm-nav-label">{lookbookTitle}</p>
            {sections.filter(s => s.type !== "banner").map((sec, i) => (
              <a
                key={sec.id}
                href={`#section-${sec.id}`}
                className="hm-nav-link"
                style={{ animationDelay: `${0.05 + i * 0.04}s` }}
                onClick={close}
              >
                {sec.title}
              </a>
            ))}
          </nav>

          <div className="hm-actions">
            <button className="hm-action-btn" onClick={() => setPanel("products")}>
              <span className="hm-action-icon">◫</span>
              Products
              <span className="hm-action-count">{products.length}</span>
              {hiddenCount > 0 && (
                <span className="hm-action-hidden-badge">{hiddenCount} hidden</span>
              )}
              <span className="hm-action-arrow">→</span>
            </button>

            <button className="hm-action-btn hm-action-btn--share" onClick={handleShareView}>
              <span className="hm-action-icon">↗</span>
              {copied ? "Link copied!" : "Share this view"}
              {hiddenCount > 0 && !copied && (
                <span className="hm-action-hidden-badge">{products.length - hiddenCount} products</span>
              )}
            </button>

            {count > 0 && (
              <button
                className="hm-action-btn hm-action-btn--accent"
                onClick={() => { triggerPrint(); close(); }}
              >
                <span className="hm-action-icon">⬡</span>
                Export PDF
                <span className="hm-action-count hm-action-count--accent">{count}</span>
              </button>
            )}
          </div>

          <div className="hm-footer">
            <span className="hm-footer-text">Powered by DLookBook</span>
          </div>
        </div>

        {/* ── Products visibility panel ── */}
        <div className={`hm-slide hm-slide--products${panel === "products" ? " hm-slide--active" : ""}`}>
          <div className="hm-header">
            <button className="hm-back" onClick={() => setPanel("main")}>← Back</button>
            <span className="hm-header-title">Show / Hide</span>
            <button className="hm-close" onClick={close} aria-label="Close">✕</button>
          </div>

          {/* Show all reset */}
          {hiddenCount > 0 && (
            <div className="hm-vis-reset">
              <span className="hm-vis-reset-label">{hiddenCount} product{hiddenCount !== 1 ? "s" : ""} hidden</span>
              <button className="hm-vis-reset-btn" onClick={showAll}>Show all</button>
            </div>
          )}

          <div className="hm-products-body">
            {Object.entries(byCategory).map(([cat, prods]) => {
              const ids = prods.map(p => p.id);
              const fullyHidden  = isCategoryFullyHidden(ids);
              const partialHidden = isCategoryPartialHidden(ids);

              return (
                <div key={cat} className="hm-category">
                  {/* Category row with checkbox */}
                  <button
                    className="hm-cat-row"
                    onClick={() => setCategoryHidden(cat, ids, !fullyHidden)}
                    aria-label={fullyHidden ? `Show category ${cat}` : `Hide category ${cat}`}
                  >
                    <span className={`hm-checkbox${fullyHidden ? " hm-checkbox--off" : partialHidden ? " hm-checkbox--partial" : " hm-checkbox--on"}`}>
                      {fullyHidden ? "" : partialHidden ? "–" : "✓"}
                    </span>
                    <span className="hm-category-label">{cat}</span>
                    <span className="hm-cat-count">{prods.length}</span>
                  </button>

                  {/* Product rows */}
                  {prods.map(p => {
                    const hidden = isProductHidden(p.id);
                    return (
                      <button
                        key={p.id}
                        className={`hm-product-vis-row${hidden ? " hm-product-vis-row--hidden" : ""}`}
                        onClick={() => toggleProductHidden(p.id)}
                        aria-label={hidden ? `Show ${p.name}` : `Hide ${p.name}`}
                      >
                        <span className={`hm-checkbox hm-checkbox--sm${hidden ? " hm-checkbox--off" : " hm-checkbox--on"}`}>
                          {hidden ? "" : "✓"}
                        </span>
                        {p.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt={p.name} className={`hm-product-thumb${hidden ? " hm-product-thumb--dim" : ""}`} />
                        )}
                        <span className="hm-product-vis-info">
                          <span className="hm-product-name">{p.name}</span>
                          <span className="hm-product-sku">{p.sku}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

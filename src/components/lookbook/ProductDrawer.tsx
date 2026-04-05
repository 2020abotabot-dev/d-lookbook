"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAssortment } from "@/lib/assortment-context";
import type { DbProduct } from "@/types/database";

interface Props {
  products: DbProduct[];  // All products assigned to this lookbook
}

export default function ProductDrawer({ products }: Props) {
  const [open,      setOpen]      = useState(false);
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [mounted,   setMounted]   = useState(false);
  const { isSelected, toggle }    = useAssortment();

  useEffect(() => { setMounted(true); }, []);

  // Track which product card is visible at mid-viewport
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight * 0.5;
      for (const p of products) {
        const el = document.getElementById(`product-${p.id}`);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= mid && bottom >= mid) {
          setActiveId(p.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [products]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(`product-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    (window as unknown as { lenis?: { scrollTo: (target: number, opts: object) => void } })
      .lenis?.scrollTo(top, { duration: 1.0 }) ?? window.scrollTo({ top, behavior: "smooth" });
    setOpen(false);
  }, []);

  const activeIdx = products.findIndex(p => p.id === activeId);

  if (!mounted || products.length === 0) return null;

  const drawer = (
    <>
      {/* Trigger */}
      <button
        className="pd-trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="Product list"
        aria-expanded={open}
      >
        <span className="pd-trigger-bars">
          <span /><span /><span />
        </span>
        {activeIdx >= 0 && (
          <span className="pd-trigger-count">{activeIdx + 1}/{products.length}</span>
        )}
      </button>

      {/* Backdrop */}
      {open && <div className="pd-backdrop" onClick={() => setOpen(false)} aria-hidden />}

      {/* Drawer */}
      <aside className={`pd-drawer${open ? " pd-drawer--open" : ""}`} aria-label="All products">
        <div className="pd-header">
          <span className="pd-header-title">Products</span>
          <span className="pd-header-count">{products.length}</span>
          <button className="pd-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>

        <div className="pd-body" data-lenis-prevent>
          {products.map(p => (
            <div
              key={p.id}
              className={`pd-item${activeId === p.id ? " pd-item--active" : ""}${isSelected(p.id) ? " pd-item--selected" : ""}`}
            >
              <button className="pd-item-nav" onClick={() => scrollTo(p.id)}>
                {p.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="pd-item-thumb" />
                )}
                <span className="pd-item-info">
                  <span className="pd-item-name">{p.name}</span>
                  <span className="pd-item-meta">{p.category}{p.sku ? ` · ${p.sku}` : ""}</span>
                </span>
              </button>
              <button
                className={`pd-item-select${isSelected(p.id) ? " pd-item-select--on" : ""}`}
                onClick={() => toggle(p)}
                aria-label={isSelected(p.id) ? `Remove ${p.name} from assortment` : `Add ${p.name} to assortment`}
                title={isSelected(p.id) ? "Remove" : "Add to assortment"}
              >
                {isSelected(p.id) ? "✓" : "+"}
              </button>
            </div>
          ))}
        </div>

        {/* Prev / Next footer */}
        {activeIdx >= 0 && (
          <div className="pd-footer">
            <button
              className="pd-nav-btn"
              disabled={activeIdx === 0}
              onClick={() => scrollTo(products[activeIdx - 1].id)}
            >
              ← Prev
            </button>
            <span className="pd-footer-pos">{activeIdx + 1} / {products.length}</span>
            <button
              className="pd-nav-btn"
              disabled={activeIdx === products.length - 1}
              onClick={() => scrollTo(products[activeIdx + 1].id)}
            >
              Next →
            </button>
          </div>
        )}
      </aside>
    </>
  );

  return createPortal(drawer, document.body);
}

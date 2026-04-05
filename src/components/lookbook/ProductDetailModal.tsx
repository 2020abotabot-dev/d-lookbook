"use client";

import { useEffect, useRef, useState } from "react";
import type { DbProduct } from "@/types/database";
import ReactMarkdown from "react-markdown";

interface ProductDetailModalProps {
  product: DbProduct | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [activeImg, setActiveImg] = useState(0);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Reset image index when product changes
  useEffect(() => { setActiveImg(0); }, [product?.id]);

  // Keyboard close
  useEffect(() => {
    if (!product) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [product, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  if (!product) return null;

  const imgSrc = product.images?.[activeImg] ?? null;
  const price  = new Intl.NumberFormat("en", {
    style: "currency",
    currency: product.currency || "EUR",
    minimumFractionDigits: 0,
  }).format(product.price);

  const specEntries = Object.entries(product.specs ?? {});

  return (
    <div
      ref={backdropRef}
      className="lb-modal__backdrop"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div className="lb-modal__panel">
        {/* Close button */}
        <button
          type="button"
          className="lb-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="lb-modal__body">
          {/* Left: images */}
          <div className="lb-modal__images">
            <div className="lb-modal__main-img">
              {imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgSrc} alt={product.name} className="lb-modal__img" />
              ) : (
                <div className="lb-card__no-image lb-modal__no-img">
                  <span>{product.name[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="lb-modal__thumbs">
                {product.images.slice(0, 6).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`${product.name} view ${i + 1}`}
                    className={`lb-modal__thumb${activeImg === i ? " lb-modal__thumb--active" : ""}`}
                    onClick={() => setActiveImg(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: details */}
          <div className="lb-modal__details">
            <p className="lb-modal__category">{product.category}</p>
            <h2 className="lb-modal__name" style={{ fontFamily: "var(--brand-font-heading)" }}>
              {product.name}
            </h2>
            <p className="lb-modal__sku">SKU: {product.sku}</p>
            <p className="lb-modal__price" style={{ color: "var(--brand-primary)" }}>
              {price}
            </p>

            {product.description && (
              <div className="lb-modal__desc">
                <ReactMarkdown>{product.description}</ReactMarkdown>
              </div>
            )}

            {specEntries.length > 0 && (
              <div className="lb-modal__specs">
                <p className="lb-modal__specs-title">Specs</p>
                <dl className="lb-modal__specs-list">
                  {specEntries.map(([k, v]) => (
                    <div key={k} className="lb-modal__spec-row">
                      <dt className="lb-modal__spec-key">{k}</dt>
                      <dd className="lb-modal__spec-val">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {product.tags?.length > 0 && (
              <div className="lb-card__tags" style={{ marginTop: "1.2rem" }}>
                {product.tags.map(tag => (
                  <span key={tag} className="lb-card__tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useScrollReveal } from "@/components/hooks/useScrollReveal";
import { useAssortment } from "@/lib/assortment-context";
import type { TemplateDefinition } from "@/lib/templates/types";
import type { DbProduct } from "@/types/database";

interface ProductCardProps {
  product: DbProduct;
  featured: boolean;
  template: TemplateDefinition;
  staggerIndex: number;
  onClick: () => void;
}

export default function ProductCard({
  product,
  featured,
  template,
  staggerIndex,
  onClick,
}: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal(ref, { threshold: 0.05 });
  const { isSelected, toggle } = useAssortment();

  const imgSrc = product.images?.[0] ?? null;
  const { cardInfoLevel, cardAspect, animation } = template;
  const hoverCls = animation.cardHover === "scale" ? " lb-card--scale"
    : animation.cardHover === "lift"  ? " lb-card--lift"
    : "";

  const staggerDelay = animation.stagger ? `${staggerIndex * 0.07}s` : "0s";

  const price = new Intl.NumberFormat("en", {
    style: "currency",
    currency: product.currency || "EUR",
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <div
      ref={ref}
      className={`lb-card lb-reveal${hoverCls}${featured ? " lb-card--featured" : ""}`}
      style={{ "--stagger-delay": staggerDelay } as React.CSSProperties}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
      aria-label={`View ${product.name}`}
    >
      {/* Image */}
      <div
        className="lb-card__image-wrap"
        style={{ aspectRatio: cardAspect }}
      >
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={product.name}
            className="lb-card__image"
            loading="lazy"
          />
        ) : (
          <div className="lb-card__no-image">
            <span>{product.name[0]?.toUpperCase()}</span>
          </div>
        )}
        {featured && (
          <span className="lb-card__badge">Featured</span>
        )}
        {/* Assortment select button */}
        <button
          className={`lb-card__select${isSelected(product.id) ? " lb-card__select--on" : ""}`}
          onClick={e => { e.stopPropagation(); toggle(product); }}
          aria-label={isSelected(product.id) ? `Remove ${product.name} from assortment` : `Add ${product.name} to assortment`}
        >
          {isSelected(product.id) ? (
            <svg viewBox="0 0 10 8" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="1,4 3.8,7 9,1" />
            </svg>
          ) : (
            <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="1" x2="5" y2="9" /><line x1="1" y1="5" x2="9" y2="5" />
            </svg>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="lb-card__info">
        <p className="lb-card__name" style={{ fontFamily: "var(--brand-font-heading)" }}>
          {product.name}
        </p>

        {cardInfoLevel !== "minimal" && (
          <p className="lb-card__category">{product.category}</p>
        )}

        <p className="lb-card__price" style={{ color: "var(--brand-primary)" }}>
          {price}
        </p>

        {cardInfoLevel === "detailed" && product.tags?.length > 0 && (
          <div className="lb-card__tags">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="lb-card__tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

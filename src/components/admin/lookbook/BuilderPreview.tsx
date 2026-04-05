"use client";

import { useState } from "react";
import type { DbLookbook, DbLookbookProduct, DbLookbookSection, DbProduct } from "@/types/database";
import type { TenantConfig } from "@/types/tenant";

interface BuilderPreviewProps {
  lookbook: DbLookbook;
  sections: DbLookbookSection[];
  assignments: DbLookbookProduct[];
  products: DbProduct[];
  tenant: TenantConfig;
}

export default function BuilderPreview({
  lookbook, sections, assignments, products, tenant
}: BuilderPreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const b = tenant.branding;

  return (
    <div className="builder-preview">
      <div className="builder-preview__controls">
        <button
          type="button"
          className={`builder-preview__vp-btn${viewport === "desktop" ? " builder-preview__vp-btn--active" : ""}`}
          onClick={() => setViewport("desktop")}
        >
          Desktop
        </button>
        <button
          type="button"
          className={`builder-preview__vp-btn${viewport === "mobile" ? " builder-preview__vp-btn--active" : ""}`}
          onClick={() => setViewport("mobile")}
        >
          Mobile
        </button>
      </div>

      <div className={`builder-preview__frame builder-preview__frame--${viewport}`}>
        <div
          className="builder-preview__lookbook"
          style={{
            "--preview-primary":   b.primary_color,
            "--preview-accent":    b.accent_color,
            "--preview-secondary": b.secondary_color,
            "--preview-heading":   `"${b.font_heading}", sans-serif`,
            "--preview-body":      `"${b.font_body}", sans-serif`,
          } as React.CSSProperties}
        >
          {/* Nav */}
          <div className="bp-nav" style={{ background: b.primary_color }}>
            <span className="bp-nav__brand" style={{ color: b.secondary_color, fontFamily: `"${b.font_heading}", sans-serif` }}>
              {b.logo_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={b.logo_url} alt="logo" className="bp-nav__logo" />
                : tenant.name
              }
            </span>
          </div>

          {/* Sections */}
          {sections
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(section => {
              if (section.type === "hero") {
                return (
                  <div key={section.id} className="bp-hero">
                    <div className="bp-hero__overlay" style={{ opacity: (section.config.overlay_opacity as number) ?? 0.4 }} />
                    <div className="bp-hero__content">
                      <h2 className="bp-hero__headline" style={{ fontFamily: `"${b.font_heading}", sans-serif`, color: b.secondary_color }}>
                        {(section.config.headline as string) ?? lookbook.title}
                      </h2>
                      <p className="bp-hero__subline" style={{ color: b.secondary_color }}>
                        {(section.config.subline as string) ?? lookbook.description}
                      </p>
                    </div>
                  </div>
                );
              }

              if (section.type === "product_grid") {
                const sectionProducts = assignments
                  .filter(a => a.section === section.id)
                  .sort((a, b) => a.position - b.position)
                  .map(a => products.find(p => p.id === a.product_id))
                  .filter(Boolean) as DbProduct[];

                return (
                  <div key={section.id} className="bp-section">
                    <h3 className="bp-section__title" style={{ fontFamily: `"${b.font_heading}", sans-serif` }}>
                      {section.title}
                    </h3>
                    <div className={`bp-grid bp-grid--${(section.config.layout as string) ?? "3-col"}`}>
                      {sectionProducts.map(p => (
                        <div key={p.id} className="bp-card">
                          <div className="bp-card__img" />
                          <p className="bp-card__name" style={{ fontFamily: `"${b.font_body}", sans-serif` }}>{p.name}</p>
                          <p className="bp-card__price" style={{ color: b.accent_color }}>
                            {p.currency} {p.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={section.id} className="bp-section">
                  <p className="bp-section__type">{section.type.replace("_", " ")}: {section.title}</p>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

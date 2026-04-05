"use client";

import type { TenantBranding } from "@/types/tenant";

interface BrandingPreviewProps {
  branding: TenantBranding;
  tenantName: string;
}

export default function BrandingPreview({ branding, tenantName }: BrandingPreviewProps) {
  return (
    <div className="branding-preview">
      <p className="branding-preview__label">Live preview</p>
      <div
        className="branding-preview__frame"
        style={{
          "--preview-primary":  branding.primary_color,
          "--preview-secondary": branding.secondary_color,
          "--preview-accent":   branding.accent_color,
          "--preview-heading":  `"${branding.font_heading}", sans-serif`,
          "--preview-body":     `"${branding.font_body}", sans-serif`,
        } as React.CSSProperties}
      >
        {/* Mini nav */}
        <div className="branding-preview__nav" style={{ background: branding.primary_color }}>
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt="logo" className="branding-preview__logo" />
          ) : (
            <span className="branding-preview__brand" style={{ color: branding.secondary_color, fontFamily: `"${branding.font_heading}", sans-serif` }}>
              {tenantName}
            </span>
          )}
        </div>

        {/* Mini hero */}
        <div className="branding-preview__hero" style={{ background: branding.secondary_color }}>
          <p className="branding-preview__hero-title" style={{ color: branding.primary_color, fontFamily: `"${branding.font_heading}", sans-serif` }}>
            SS27 Collection
          </p>
          <p className="branding-preview__hero-sub" style={{ fontFamily: `"${branding.font_body}", sans-serif` }}>
            Built for the outdoors
          </p>
          <button className="branding-preview__cta" style={{ background: branding.accent_color, fontFamily: `"${branding.font_body}", sans-serif` }}>
            Explore
          </button>
        </div>

        {/* Mini product grid */}
        <div className="branding-preview__grid">
          {[1,2,3].map(i => (
            <div key={i} className="branding-preview__card">
              <div className="branding-preview__card-img" />
              <p className="branding-preview__card-name" style={{ fontFamily: `"${branding.font_body}", sans-serif` }}>
                Product {i}
              </p>
              <p className="branding-preview__card-price" style={{ color: branding.accent_color }}>
                €149
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

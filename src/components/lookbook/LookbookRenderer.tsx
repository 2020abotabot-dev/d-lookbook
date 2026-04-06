"use client";

// ── LookbookRenderer — public-facing rendering engine ─────────────────────────
// Takes tenant config, lookbook, sections, products + assignments and renders
// a fully themed, animated, interactive lookbook page.

import { useState, useEffect } from "react";
import { getTemplate } from "@/lib/templates";
import { LookbookFilterProvider } from "@/lib/lookbook-filter-context";
import { trackEvent } from "@/lib/analytics";

import LookbookNav from "@/components/lookbook/LookbookNav";
import PublicFilterBar from "@/components/lookbook/PublicFilterBar";
import ProductDetailModal from "@/components/lookbook/ProductDetailModal";
import HamburgerMenu from "@/components/lookbook/HamburgerMenu";
import ProductDrawer from "@/components/lookbook/ProductDrawer";
import AssortmentBar from "@/components/lookbook/AssortmentBar";
import AssortmentPrint from "@/components/lookbook/AssortmentPrint";
import { AssortmentProvider } from "@/lib/assortment-context";
import { PrintProvider } from "@/lib/print-context";
import HeroSection from "@/components/lookbook/sections/HeroSection";
import ProductGridSection from "@/components/lookbook/sections/ProductGridSection";
import EditorialSection from "@/components/lookbook/sections/EditorialSection";
import CampaignSection from "@/components/lookbook/sections/CampaignSection";
import BannerSection from "@/components/lookbook/sections/BannerSection";
// ── Cinematic sections ────────────────────────────────────────────────────────
import VideoHeroSection from "@/components/lookbook/sections/VideoHeroSection";
import HorizontalScrollSection from "@/components/lookbook/sections/HorizontalScrollSection";
import StickyChaptersSection from "@/components/lookbook/sections/StickyChaptersSection";
import ParallaxEditorialSection from "@/components/lookbook/sections/ParallaxEditorialSection";

import type { DbLookbook, DbLookbookSection, DbLookbookProduct, DbProduct } from "@/types/database";
import type { TenantConfig } from "@/types/tenant";

interface LookbookRendererProps {
  tenant:            TenantConfig;
  lookbook:          DbLookbook;
  sections:          DbLookbookSection[];
  assignments:       DbLookbookProduct[];
  products:          DbProduct[];
  /** Buyer preview mode — hides all customisation UI, applies sales rep's selection */
  buyerMode?:        boolean;
  initialHiddenIds?: string[];
}

export default function LookbookRenderer({
  tenant,
  lookbook,
  sections,
  assignments,
  products,
  buyerMode = false,
  initialHiddenIds,
}: LookbookRendererProps) {
  const template = getTemplate(lookbook.template_id);
  const { branding } = tenant;

  const [activeProduct, setActiveProduct] = useState<DbProduct | null>(null);

  // Track page view on mount
  useEffect(() => {
    trackEvent(tenant.id, lookbook.id, "page_view");
  }, [tenant.id, lookbook.id]);

  // Derive unique categories from all assigned products for the filter bar
  const assignedProductIds = new Set(assignments.map(a => a.product_id));
  const assignedProducts   = products.filter(p => assignedProductIds.has(p.id));
  const categories         = [...new Set(assignedProducts.map(p => p.category).filter(Boolean))];

  function handleProductClick(product: DbProduct) {
    setActiveProduct(product);
    trackEvent(tenant.id, lookbook.id, "product_view", product.id, {
      product_name: product.name,
    });
  }

  // Sort sections by sort_order
  const orderedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  // CSS variable injection — all branded components reference these
  const cssVars: React.CSSProperties = {
    "--brand-primary":      branding.primary_color,
    "--brand-secondary":    branding.secondary_color,
    "--brand-accent":       branding.accent_color,
    "--brand-font-heading": `"${branding.font_heading}", sans-serif`,
    "--brand-font-body":    `"${branding.font_body}", sans-serif`,
  } as React.CSSProperties;

  // Load Google Font if not a system font
  const SYSTEM_FONTS = ["Inter", "Arial", "Helvetica", "Georgia", "Times New Roman"];
  const needsFontLoad = (font: string) => !SYSTEM_FONTS.includes(font);
  const fontsToLoad = [
    ...(needsFontLoad(branding.font_heading) ? [branding.font_heading] : []),
    ...(needsFontLoad(branding.font_body) && branding.font_body !== branding.font_heading
      ? [branding.font_body]
      : []),
  ];

  return (
    <PrintProvider>
    <AssortmentProvider>
    <LookbookFilterProvider initialHiddenIds={initialHiddenIds} readOnly={buyerMode}>
      {/* Google Fonts injection */}
      {fontsToLoad.length > 0 && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?${fontsToLoad
            .map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600`)
            .join("&")}&display=swap`}
        />
      )}

      <div className="lb-page" style={cssVars}>
        {/* Navigation */}
        <LookbookNav
          title={lookbook.title}
          logoUrl={branding.logo_url || undefined}
          brandName={tenant.name}
          template={template}
        />

        {/* Hamburger menu — hidden in buyer preview mode */}
        {!buyerMode && (
          <HamburgerMenu
            brandName={tenant.name}
            logoUrl={branding.logo_url || undefined}
            lookbookTitle={lookbook.title}
            products={assignedProducts}
            sections={orderedSections}
          />
        )}

        {/* Product drawer — hidden in buyer preview mode */}
        {!buyerMode && <ProductDrawer products={assignedProducts} />}

        {/* Category filter bar — hidden in buyer preview mode */}
        {!buyerMode && template.showFilterBar && categories.length > 0 && (
          <div className="lb-fbar-wrap">
            <PublicFilterBar categories={categories} />
          </div>
        )}

        {/* Buyer preview badge */}
        {buyerMode && (
          <div className="lb-buyer-badge">
            Curated selection
          </div>
        )}

        {/* Sections */}
        <main className="lb-sections">
          {orderedSections.map(section => {
            switch (section.type) {
              case "hero":
                return (
                  <HeroSection
                    key={section.id}
                    section={section}
                    template={template}
                    brandPrimary={branding.primary_color}
                    brandHeadingFont={branding.font_heading}
                  />
                );
              case "product_grid":
                return (
                  <ProductGridSection
                    key={section.id}
                    section={section}
                    assignments={assignments}
                    allProducts={products}
                    template={template}
                    tenantId={tenant.id}
                    lookbookId={lookbook.id}
                    onProductClick={handleProductClick}
                  />
                );
              case "editorial":
                return (
                  <EditorialSection
                    key={section.id}
                    section={section}
                    template={template}
                  />
                );
              case "campaign":
                return (
                  <CampaignSection
                    key={section.id}
                    section={section}
                    template={template}
                  />
                );
              case "banner":
                return (
                  <BannerSection
                    key={section.id}
                    section={section}
                  />
                );
              // ── Cinematic sections ──────────────────────────────────────────
              case "video_hero":
                return (
                  <VideoHeroSection
                    key={section.id}
                    section={section}
                    brandPrimary={branding.primary_color}
                  />
                );
              case "horizontal_scroll":
                return (
                  <HorizontalScrollSection
                    key={section.id}
                    section={section}
                  />
                );
              case "sticky_chapters":
                return (
                  <StickyChaptersSection
                    key={section.id}
                    section={section}
                  />
                );
              case "parallax_editorial":
                return (
                  <ParallaxEditorialSection
                    key={section.id}
                    section={section}
                  />
                );
              default:
                return null;
            }
          })}
        </main>

        {/* Footer */}
        <footer className="lb-footer" style={{ fontFamily: "var(--brand-font-body)" }}>
          <p>
            {tenant.name}
            {lookbook.published_at && (
              <span className="lb-footer__date">
                {" · "}
                {new Date(lookbook.published_at).getFullYear()}
              </span>
            )}
          </p>
          <p className="lb-footer__powered">
            Powered by <span style={{ color: "var(--brand-primary)" }}>DLookBook</span>
          </p>
        </footer>
      </div>

      {/* Product detail modal */}
      <ProductDetailModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
      />

      {/* Floating assortment bar — hidden in buyer preview mode */}
      {!buyerMode && <AssortmentBar />}

      {/* Print layout — hidden on screen, shown on @media print */}
      {!buyerMode && (
        <AssortmentPrint
          tenant={tenant}
          lookbookTitle={lookbook.title}
        />
      )}
    </LookbookFilterProvider>
    </AssortmentProvider>
    </PrintProvider>
  );
}

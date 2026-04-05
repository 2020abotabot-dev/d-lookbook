"use client";

import { useRef } from "react";
import { useScrollReveal } from "@/components/hooks/useScrollReveal";
import type { DbLookbookSection } from "@/types/database";

interface BannerSectionProps {
  section: DbLookbookSection;
}

export default function BannerSection({ section }: BannerSectionProps) {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref);

  const cfg = section.config as {
    headline?: string;
    bg_color?: string;
    cta_link?: string;
    cta_label?: string;
  };

  const text     = cfg.headline ?? section.title ?? "";
  const bg       = cfg.bg_color ?? "var(--brand-primary, #111)";
  const ctaLink  = cfg.cta_link;
  const ctaLabel = cfg.cta_label ?? "Shop Now";

  // Determine if bg is light or dark to pick text colour
  const isDark = isColorDark(cfg.bg_color ?? "#111111");

  return (
    <section
      ref={ref}
      id={`section-${section.id}`}
      className="lb-banner lb-reveal"
      style={{
        background: bg,
        padding: "2.5rem 3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2rem",
        flexWrap: "wrap",
      }}
    >
      <p style={{
        fontFamily: "var(--brand-font-heading, sans-serif)",
        fontWeight: 400,
        fontSize: "clamp(0.95rem, 2.2vw, 1.4rem)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: isDark ? "#fff" : "#111",
        margin: 0,
      }}>
        {text}
      </p>

      {ctaLink && (
        <a
          href={ctaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="lb-banner__cta"
          style={{
            fontFamily: "var(--brand-font-body, sans-serif)",
            fontSize: "0.72rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: isDark ? "#fff" : "#111",
            border: `1.5px solid ${isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"}`,
            padding: "0.5rem 1.4rem",
            textDecoration: "none",
            transition: "opacity 0.2s ease",
          }}
        >
          {ctaLabel} →
        </a>
      )}
    </section>
  );
}

function isColorDark(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived luminance
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

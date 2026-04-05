"use client";

import { useRef, useEffect } from "react";
import { useScrollReveal } from "@/components/hooks/useScrollReveal";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { TemplateDefinition } from "@/lib/templates/types";
import type { DbLookbookSection } from "@/types/database";

gsap.registerPlugin(ScrollTrigger);

interface CampaignSectionProps {
  section: DbLookbookSection;
  template: TemplateDefinition;
}

export default function CampaignSection({ section, template }: CampaignSectionProps) {
  const ref    = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  useScrollReveal(ref);

  const cfg = section.config as {
    headline?: string;
    media_url?: string;
    overlay_opacity?: number;
  };

  const headline       = cfg.headline ?? section.title ?? "";
  const overlayOpacity = cfg.overlay_opacity ?? 0.35;

  // Parallax background for non-minimal templates
  useEffect(() => {
    if (template.animation.preset === "minimal") return;
    const el = imgRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el.parentElement ?? el,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
        onUpdate: (self) => {
          el.style.transform = `scale(1.1) translateY(${(self.progress - 0.5) * 8}%)`;
        },
      });
    });
    return () => ctx.revert();
  }, [template.animation.preset]);

  const height = template.sectionSpacing === "compact" ? "55vh" : "70vh";

  return (
    <section
      ref={ref}
      id={`section-${section.id}`}
      className="lb-campaign lb-reveal"
      style={{ height, position: "relative", overflow: "hidden" }}
      aria-label={headline}
    >
      {/* Background */}
      <div
        ref={imgRef}
        className="lb-campaign__bg"
        style={{
          position: "absolute", inset: "-10% 0",
          background: cfg.media_url
            ? `url(${cfg.media_url}) center/cover no-repeat`
            : "linear-gradient(135deg, var(--brand-primary, #111) 0%, #333 100%)",
          willChange: "transform",
        }}
      />

      {/* Overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `rgba(0,0,0,${overlayOpacity})`,
        zIndex: 1,
      }} />

      {/* Headline */}
      {headline && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <h2 style={{
            fontFamily: "var(--brand-font-heading, sans-serif)",
            fontWeight: 300,
            fontSize: "clamp(2rem, 6vw, 5rem)",
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            color: "#fff",
            textAlign: "center",
            margin: 0,
            padding: "0 2rem",
            textShadow: "0 2px 24px rgba(0,0,0,0.4)",
          }}>
            {headline}
          </h2>
        </div>
      )}
    </section>
  );
}

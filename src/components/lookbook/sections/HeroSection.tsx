"use client";

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useScrollVideo } from "@/components/hooks/useScrollVideo";
import type { TemplateDefinition } from "@/lib/templates/types";
import type { DbLookbookSection } from "@/types/database";

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  section: DbLookbookSection;
  template: TemplateDefinition;
  brandPrimary: string;
  brandHeadingFont: string;
}

export default function HeroSection({
  section,
  template,
  brandPrimary,
  brandHeadingFont,
}: HeroSectionProps) {
  const cfg = section.config as {
    headline?: string;
    subline?: string;
    overlay_opacity?: number;
    media_url?: string;
    media_type?: "image" | "video";
  };

  const headline = cfg.headline ?? section.title ?? "";
  const subline   = cfg.subline  ?? section.description ?? "";
  const mediaUrl  = cfg.media_url;
  const mediaType = cfg.media_type ?? "image";

  const { heroEffect, preset } = template.animation;
  const isExpressive = preset === "expressive" || preset === "standard";

  // ── Scroll-video refs ────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const overlayRef   = useRef<HTMLDivElement>(null);
  const headlineRef  = useRef<HTMLDivElement>(null);
  const sublineRef   = useRef<HTMLParagraphElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  const handleProgress = useCallback((progress: number) => {
    if (overlayRef.current) {
      // Fade to brand color overlay from 40% → 75%
      const fade = Math.max(0, Math.min(1, (progress - 0.40) / 0.35));
      overlayRef.current.style.opacity = String(fade);
    }
    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = String(Math.max(0, 1 - progress * 8));
    }
  }, []);

  // Scroll video (for expressive / video hero)
  useScrollVideo(
    heroEffect === "video-scroll" && mediaType === "video" && !!mediaUrl ? videoRef : { current: null } as typeof videoRef,
    heroEffect === "video-scroll" ? containerRef : { current: null } as typeof containerRef,
    { start: "top top", end: "bottom bottom", onProgress: handleProgress }
  );

  // Parallax image (for parallax hero)
  useEffect(() => {
    if (heroEffect !== "parallax" || !mediaUrl || mediaType === "video") return;
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const bg = container.querySelector<HTMLElement>(".lb-hero__bg");
          if (bg) {
            bg.style.transform = `scale(1.12) translateY(${self.progress * 8}%)`;
          }
        },
      });
    });
    return () => ctx.revert();
  }, [heroEffect, mediaUrl, mediaType]);

  // GSAP entrance animations for text (expressive/standard only)
  useEffect(() => {
    if (!isExpressive || !headlineRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });
      if (headlineRef.current) {
        tl.from(headlineRef.current, {
          clipPath: "inset(0 100% 0 0)",
          duration: 1.1,
          ease: "power3.inOut",
        });
      }
      if (sublineRef.current) {
        tl.from(sublineRef.current, {
          y: 16, opacity: 0, duration: 0.7, ease: "power3.out",
        }, "-=0.3");
      }
    });
    return () => ctx.revert();
  }, [isExpressive]);

  // ── Heights / sticky ─────────────────────────────────────────────────────
  const usesScroll = heroEffect === "video-scroll" && mediaType === "video" && !!mediaUrl;
  const outerH = usesScroll ? "200vh" : template.heroHeight;

  const overlayColor = brandPrimary.startsWith("#")
    ? brandPrimary
    : "#111111";

  return (
    <section
      ref={containerRef}
      id={`section-${section.id}`}
      style={{ height: outerH, position: "relative" }}
      aria-label={headline || "Hero"}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          background: "#111",
        }}
      >
        {/* ── Background media ── */}
        {mediaUrl && mediaType === "video" ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            preload="auto"
            playsInline
            muted
            className="lb-hero__bg"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%", objectFit: "cover",
            }}
          />
        ) : mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt=""
            className="lb-hero__bg"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              transformOrigin: "center center",
              willChange: "transform",
            }}
          />
        ) : (
          // Fallback gradient using brand color
          <div
            className="lb-hero__bg"
            style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(135deg, ${overlayColor}ee 0%, ${overlayColor}88 50%, #000 100%)`,
            }}
          />
        )}

        {/* Dark gradient at bottom */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)",
          pointerEvents: "none",
          zIndex: 1,
        }} />

        {/* Overlay (brand color, fades in on scroll for video heroes) */}
        {usesScroll && (
          <div
            ref={overlayRef}
            style={{
              position: "absolute", inset: 0,
              background: overlayColor,
              opacity: 0, pointerEvents: "none", zIndex: 2,
            }}
          />
        )}

        {/* ── Text content ── */}
        <div
          style={{
            position: "absolute",
            bottom: "4.5rem", left: "3rem", right: "3rem",
            zIndex: 10,
          }}
        >
          {headline && (
            <div ref={headlineRef} style={{ overflow: "hidden" }}>
              <h1
                style={{
                  fontFamily: `"${brandHeadingFont}", sans-serif`,
                  fontWeight: 300,
                  fontSize: "clamp(2.5rem, 8vw, 6.5rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.01em",
                  textTransform: "uppercase",
                  color: "#fff",
                  margin: 0,
                  textShadow: "0 2px 32px rgba(0,0,0,0.4)",
                }}
              >
                {headline}
              </h1>
            </div>
          )}

          {subline && (
            <p
              ref={sublineRef}
              style={{
                fontFamily: `"${brandHeadingFont}", sans-serif`,
                fontWeight: 300,
                fontSize: "clamp(0.75rem, 1.4vw, 1rem)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                margin: "1rem 0 0",
              }}
            >
              {subline}
            </p>
          )}
        </div>

        {/* ── Scroll hint ── */}
        <div
          ref={scrollHintRef}
          style={{
            position: "absolute", bottom: "2rem", left: "50%",
            transform: "translateX(-50%)", zIndex: 10,
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
          }}
        >
          <ScrollArrow color={brandPrimary} />
        </div>
      </div>
    </section>
  );
}

function ScrollArrow({ color }: { color: string }) {
  return (
    <svg width="20" height="32" viewBox="0 0 20 32" fill="none">
      <rect x="1" y="1" width="18" height="26" rx="9"
        stroke={`${color}88`} strokeWidth="1.5" />
      <rect x="9" y="6" width="2" height="6" rx="1"
        fill={`${color}bb`}
        style={{ animation: "lb-scroll-bounce 1.8s ease-in-out infinite" }} />
    </svg>
  );
}

"use client";

// ── VideoHeroSection ───────────────────────────────────────────────────────────
// Scroll-scrubbed video with word-by-word headline reveal.
// Replicates MRL-SS27 Hero (300vh, video scrub + staggered word entrance).
//
// Config shape:
// {
//   video_url: string,
//   words: string[],       // Revealed word-by-word as user scrolls
//   subline?: string,
//   overlay_start?: number // 0-1, scroll progress where white overlay begins (default 0.42)
// }

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DbLookbookSection } from "@/types/database";

interface VHeroConfig {
  video_url?:      string;
  words?:          string[];
  subline?:        string;
  overlay_start?:  number;
  fallback_image?: string;
}

interface Props {
  section:      DbLookbookSection;
  brandPrimary?: string;
}

export default function VideoHeroSection({ section, brandPrimary }: Props) {
  const outerRef   = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const ctxRef     = useRef<gsap.Context | null>(null);

  const cfg          = (section.config ?? {}) as VHeroConfig;
  const words        = cfg.words ?? [section.title];
  const overlayStart = cfg.overlay_start ?? 0.42;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    ctxRef.current = gsap.context(() => {
      const outer   = outerRef.current!;
      const video   = videoRef.current;
      const overlay = overlayRef.current!;

      // ── Video scrub ───────────────────────────────────────────────────────────
      const videoEl = video;
      if (videoEl && cfg.video_url) {
        ScrollTrigger.create({
          trigger: outer,
          start:   "top top",
          end:     "bottom bottom",
          scrub:   1.5,
          onUpdate(self) {
            const el = videoEl as unknown as { duration: number; currentTime: number; fastSeek?: (t: number) => void };
            const target = self.progress * (el.duration || 1);
            if (typeof el.fastSeek === "function") {
              el.fastSeek(target);
            } else {
              el.currentTime = target;
            }
          },
        });
      }

      // ── Overlay fade-in ───────────────────────────────────────────────────────
      ScrollTrigger.create({
        trigger: outer,
        start:   "top top",
        end:     "bottom bottom",
        scrub:   true,
        onUpdate(self) {
          if (self.progress >= overlayStart) {
            const t = Math.min(1, (self.progress - overlayStart) / 0.30);
            overlay.style.opacity = String(t * 0.88);
          } else {
            overlay.style.opacity = "0";
          }
        },
      });

      // ── Word-by-word reveal ───────────────────────────────────────────────────
      const wordEls = outer.querySelectorAll<HTMLElement>(".vh-word");
      wordEls.forEach((el, i) => {
        const startAt = 0.50 + i * 0.10;
        gsap.set(el, { y: 18, opacity: 0 });
        ScrollTrigger.create({
          trigger: outer,
          start:   "top top",
          end:     "bottom bottom",
          scrub:   false,
          onUpdate(self) {
            if (self.progress >= startAt) {
              gsap.to(el, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", overwrite: "auto" });
            }
          },
        });
      });

      // ── Subline entrance ─────────────────────────────────────────────────────
      const sublineEl = outer.querySelector<HTMLElement>(".vh-subline");
      if (sublineEl) {
        gsap.set(sublineEl, { y: 12, opacity: 0 });
        ScrollTrigger.create({
          trigger: outer,
          start:   "top top",
          end:     "bottom bottom",
          onUpdate(self) {
            if (self.progress >= 0.80) {
              gsap.to(sublineEl, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", overwrite: "auto" });
            }
          },
        });
      }
    }, outerRef);

    return () => ctxRef.current?.revert();
  }, [cfg.video_url, overlayStart]);

  return (
    <section ref={outerRef} className="vh-outer" aria-label={section.title}>
      <div className="vh-sticky">
        {/* Video or fallback image */}
        {cfg.video_url ? (
          <video
            ref={videoRef}
            className="vh-video"
            src={cfg.video_url}
            playsInline
            muted
            preload="auto"
            aria-hidden
          />
        ) : (
          <div
            className="vh-fallback"
            style={{
              backgroundImage: cfg.fallback_image
                ? `url(${cfg.fallback_image})`
                : undefined,
              backgroundColor: cfg.fallback_image ? undefined : brandPrimary ?? "#111",
            }}
          />
        )}

        {/* White overlay */}
        <div ref={overlayRef} className="vh-overlay" aria-hidden />

        {/* Headline words */}
        <div className="vh-headline-wrap" aria-label={words.join(" ")}>
          {words.map((w, i) => (
            <span key={i} className="vh-word" aria-hidden>
              {w}
            </span>
          ))}
        </div>

        {/* Subline */}
        {cfg.subline && (
          <p className="vh-subline">{cfg.subline}</p>
        )}

        {/* Scroll hint */}
        <div className="vh-scroll-hint" aria-hidden>
          <span className="vh-scroll-hint__icon" />
          <span className="vh-scroll-hint__text">Scroll</span>
        </div>
      </div>
    </section>
  );
}

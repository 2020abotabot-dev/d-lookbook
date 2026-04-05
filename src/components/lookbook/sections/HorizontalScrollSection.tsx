"use client";

// ── HorizontalScrollSection ────────────────────────────────────────────────────
// Side-scroll panels locked to vertical scroll via GSAP ScrollTrigger.
// Replicates the MRL-SS27 Moab Speed 3 / Technologies horizontal scroll effect.
//
// Config shape:
// {
//   panels: [{ id, title, body?, image_url?, accent_color?, label? }],
//   snap: boolean   (default true)
// }

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DbLookbookSection } from "@/types/database";

interface Panel {
  id:            string;
  title:         string;
  body?:         string;
  image_url?:    string;
  accent_color?: string;
  label?:        string;
}

interface HScrollConfig {
  panels: Panel[];
  snap?:  boolean;
}

interface Props {
  section: DbLookbookSection;
}

export default function HorizontalScrollSection({ section }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const ctxRef   = useRef<gsap.Context | null>(null);

  const cfg     = (section.config ?? {}) as Partial<HScrollConfig>;
  const panels  = cfg.panels ?? [];
  const doSnap  = cfg.snap !== false;
  const N       = panels.length;

  useEffect(() => {
    if (N < 2) return;
    gsap.registerPlugin(ScrollTrigger);

    ctxRef.current = gsap.context(() => {
      const outer = outerRef.current!;
      const track = trackRef.current!;

      // Horizontal translation: move track left by (N-1) viewport widths
      const tl = gsap.timeline();
      tl.to(track, {
        x:        `${-(N - 1) * 100}vw`,
        ease:     "none",
        duration: N - 1,
      });

      ScrollTrigger.create({
        trigger:   outer,
        start:     "top top",
        end:       "bottom bottom",
        scrub:     2,
        animation: tl,
        ...(doSnap ? {
          snap: {
            snapTo:   1 / (N - 1),
            duration: { min: 0.3, max: 0.6 },
            delay:    0.05,
            ease:     "power2.inOut",
          },
        } : {}),
        onUpdate(self) {
          // Highlight active panel
          const raw = self.progress * (N - 1);
          const panelEls = track.querySelectorAll<HTMLElement>(".hs-panel");
          panelEls.forEach((el, i) => {
            const active = Math.round(raw) === i;
            el.classList.toggle("hs-panel--active", active);
          });
        },
      });

      // Entrance animation for each panel's text
      const panelEls = track.querySelectorAll<HTMLElement>(".hs-panel");
      panelEls.forEach((panel, i) => {
        const texts = panel.querySelectorAll<HTMLElement>(".hs-panel__animate");
        if (!texts.length) return;
        gsap.set(texts, { y: 28, opacity: 0 });
        ScrollTrigger.create({
          trigger:   outer,
          start:     "top top",
          end:       "bottom bottom",
          scrub:     false,
          onUpdate(self) {
            const progress = self.progress * (N - 1);
            if (Math.abs(progress - i) < 0.35) {
              gsap.to(texts, {
                y:        0,
                opacity:  1,
                duration: 0.6,
                stagger:  0.08,
                ease:     "power3.out",
                overwrite: "auto",
              });
            }
          },
        });
      });
    }, outerRef);

    return () => ctxRef.current?.revert();
  }, [N, doSnap]);

  if (N === 0) return null;

  // Section height = 100vh + (N-1) * 100vw  →  approximated in CSS as vh units
  // We use a sticky inner + outer with explicit height set via inline style + CSS var
  return (
    <section
      ref={outerRef}
      className="hs-outer"
      style={{ "--hs-panels": N } as React.CSSProperties}
      aria-label={section.title}
    >
      <div className="hs-sticky">
        {/* Counter */}
        <div className="hs-counter">
          <span className="hs-counter__current">01</span>
          <span className="hs-counter__sep"> / </span>
          <span className="hs-counter__total">{String(N).padStart(2, "0")}</span>
        </div>

        {/* Scrolling track */}
        <div ref={trackRef} className="hs-track">
          {panels.map((panel, i) => (
            <div
              key={panel.id}
              className="hs-panel"
              style={{ "--hs-accent": panel.accent_color ?? "var(--brand-accent)" } as React.CSSProperties}
            >
              {/* Background image */}
              {panel.image_url && (
                <div className="hs-panel__bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={panel.image_url}
                    alt={panel.title}
                    className="hs-panel__bg-img"
                    draggable={false}
                  />
                  <div className="hs-panel__overlay" />
                </div>
              )}

              {!panel.image_url && (
                <div className="hs-panel__bg hs-panel__bg--color" />
              )}

              {/* Content */}
              <div className="hs-panel__content">
                {panel.label && (
                  <p className="hs-panel__label hs-panel__animate">{panel.label}</p>
                )}
                <h2 className="hs-panel__title hs-panel__animate">{panel.title}</h2>
                {panel.body && (
                  <p className="hs-panel__body hs-panel__animate">{panel.body}</p>
                )}
              </div>

              {/* Panel number */}
              <span className="hs-panel__num">{String(i + 1).padStart(2, "0")}</span>

              {/* Accent rule */}
              <div className="hs-panel__rule hs-panel__animate" />
            </div>
          ))}
        </div>

        {/* Dot navigation */}
        <div className="hs-dots" aria-hidden>
          {panels.map((_, i) => (
            <span key={i} className="hs-dot" />
          ))}
        </div>

        {/* Drag hint */}
        <div className="hs-drag-hint">
          <span className="hs-drag-hint__icon">→</span>
          <span className="hs-drag-hint__text">Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}

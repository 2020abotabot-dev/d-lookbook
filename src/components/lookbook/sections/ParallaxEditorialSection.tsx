"use client";

// ── ParallaxEditorialSection ───────────────────────────────────────────────────
// Dual-image parallax (opposite directions) + velocity-blur headline.
// Replicates MRL-SS27 Brand Purpose section.
//
// Config shape:
// {
//   headline: string,
//   body?: string,
//   image_left_url?: string,
//   image_right_url?: string
// }

import { useRef, useEffect } from "react";
import type { DbLookbookSection } from "@/types/database";

interface PEConfig {
  headline?:        string;
  body?:            string;
  image_left_url?:  string;
  image_right_url?: string;
}

interface Props {
  section: DbLookbookSection;
}

export default function ParallaxEditorialSection({ section }: Props) {
  const rootRef    = useRef<HTMLElement>(null);
  const imgLeftRef = useRef<HTMLDivElement>(null);
  const imgRightRef= useRef<HTMLDivElement>(null);
  const headRef    = useRef<HTMLHeadingElement>(null);
  const rafRef     = useRef<number>(0);
  const lastY      = useRef(0);
  const velocity   = useRef(0);

  const cfg = (section.config ?? {}) as PEConfig;

  useEffect(() => {
    function onScroll() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const root = rootRef.current;
        if (!root) return;

        const { top, height } = root.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, -top / Math.max(1, height - window.innerHeight)));

        // Parallax: left image moves down (+90px), right moves up (-75px)
        const yLeft  =  progress * 90;
        const yRight = -progress * 75;

        if (imgLeftRef.current)  imgLeftRef.current.style.transform  = `translateY(${yLeft}px)`;
        if (imgRightRef.current) imgRightRef.current.style.transform = `translateY(${yRight}px)`;

        // Velocity-based blur on headline
        const currentY   = window.scrollY;
        const delta      = Math.abs(currentY - lastY.current);
        lastY.current    = currentY;
        velocity.current = velocity.current * 0.72 + delta * 0.28;

        const blur = Math.min(velocity.current * 0.04, 4);
        if (headRef.current) {
          headRef.current.style.filter = `blur(${blur.toFixed(1)}px)`;
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section ref={rootRef} className="pe-section" aria-label={section.title}>
      <div className="pe-inner">
        {/* Headline with velocity blur */}
        <div className="pe-headline-wrap">
          <h2 ref={headRef} className="pe-headline">
            {cfg.headline ?? section.title}
          </h2>
          {cfg.body && <p className="pe-body">{cfg.body}</p>}
        </div>

        {/* Dual parallax images */}
        <div className="pe-images">
          <div className="pe-image-col pe-image-col--left">
            <div ref={imgLeftRef} className="pe-image-inner">
              {cfg.image_left_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.image_left_url} alt="" className="pe-image" draggable={false} />
              ) : (
                <div className="pe-image pe-image--placeholder" />
              )}
            </div>
          </div>

          <div className="pe-image-col pe-image-col--right">
            <div ref={imgRightRef} className="pe-image-inner">
              {cfg.image_right_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.image_right_url} alt="" className="pe-image" draggable={false} />
              ) : (
                <div className="pe-image pe-image--placeholder" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

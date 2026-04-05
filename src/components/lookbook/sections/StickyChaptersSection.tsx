"use client";

// ── StickyChaptersSection ──────────────────────────────────────────────────────
// Multi-chapter sticky scroll: left column shows chapter text, right column
// swaps between themed panels. Replicates MRL-SS27 Story / Sustainability sections.
//
// Config shape:
// {
//   chapters: [{ eyebrow?, headline, body?, panel_color?, panel_image_url? }]
// }

import { useRef, useEffect, useState } from "react";
import type { DbLookbookSection } from "@/types/database";

interface Chapter {
  eyebrow?:          string;
  headline:          string;
  body?:             string;
  panel_color?:      string;
  panel_image_url?:  string;
}

interface Props {
  section: DbLookbookSection;
}

export default function StickyChaptersSection({ section }: Props) {
  const outerRef    = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [textVis, setTextVis] = useState(true);

  const cfg      = (section.config ?? {}) as { chapters?: Chapter[] };
  const chapters = cfg.chapters ?? [];
  const N        = chapters.length;

  useEffect(() => {
    if (N === 0) return;

    function onScroll() {
      const outer = outerRef.current;
      if (!outer) return;

      const { top, height } = outer.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -top / (height - window.innerHeight)));

      const chapterIdx = Math.min(N - 1, Math.floor(progress * N));
      setActive(chapterIdx);

      // Fade text out near end of each chapter (at 78% into the sub-chapter)
      const subProgress = (progress * N) % 1;
      setTextVis(subProgress < 0.78 || chapterIdx === N - 1);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [N]);

  if (N === 0) return null;

  return (
    <section
      ref={outerRef}
      className="sc-outer"
      style={{ "--sc-chapters": N } as React.CSSProperties}
      aria-label={section.title}
    >
      <div className="sc-sticky">
        {/* Left column — sticky text */}
        <div className="sc-left">
          {chapters.map((ch, i) => (
            <div
              key={i}
              className={`sc-chapter-text${active === i ? " sc-chapter-text--active" : ""}${!textVis && active === i ? " sc-chapter-text--exit" : ""}`}
            >
              {ch.eyebrow && (
                <p className="sc-eyebrow">{ch.eyebrow}</p>
              )}
              <h2 className="sc-headline">{ch.headline}</h2>
              {ch.body && <p className="sc-body">{ch.body}</p>}
            </div>
          ))}

          {/* Chapter progress dots */}
          <div className="sc-progress-dots" aria-hidden>
            {chapters.map((_, i) => (
              <span
                key={i}
                className={`sc-dot${active === i ? " sc-dot--active" : ""}`}
              />
            ))}
          </div>
          <p className="sc-chapter-count" aria-live="polite">
            {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
          </p>
        </div>

        {/* Right column — visual panels */}
        <div className="sc-right">
          {chapters.map((ch, i) => (
            <div
              key={i}
              className={`sc-panel${active === i ? " sc-panel--active" : ""}`}
              style={{
                "--sc-panel-color": ch.panel_color ?? "var(--brand-primary)",
              } as React.CSSProperties}
            >
              {ch.panel_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ch.panel_image_url}
                  alt={ch.headline}
                  className="sc-panel__img"
                  draggable={false}
                />
              ) : (
                <div className="sc-panel__placeholder">
                  <span className="sc-panel__chapter-num">{String(i + 1).padStart(2, "0")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import { useScrollReveal } from "@/components/hooks/useScrollReveal";
import type { TemplateDefinition } from "@/lib/templates/types";
import type { DbLookbookSection } from "@/types/database";
import ReactMarkdown from "react-markdown";

interface EditorialSectionProps {
  section: DbLookbookSection;
  template: TemplateDefinition;
}

export default function EditorialSection({ section, template }: EditorialSectionProps) {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref, { threshold: 0.08 });

  const cfg = section.config as {
    body?: string;
    image_position?: "left" | "right" | "full";
    bg_color?: string;
    media_url?: string;
  };

  const imgPos = cfg.image_position ?? "right";
  const isFull = imgPos === "full";

  const spacing = template.sectionSpacing === "compact"
    ? "2.5rem 2rem"
    : template.sectionSpacing === "generous"
      ? "7rem 3rem"
      : "4.5rem 2.5rem";

  return (
    <section
      ref={ref}
      id={`section-${section.id}`}
      className="lb-editorial lb-reveal"
      style={{
        padding: spacing,
        background: cfg.bg_color ?? "transparent",
      }}
    >
      {isFull ? (
        <div className="lb-editorial__full">
          {cfg.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cfg.media_url} alt="" className="lb-editorial__full-img" />
          )}
          <div className="lb-editorial__full-text">
            <h2 className="lb-editorial__heading" style={{ fontFamily: "var(--brand-font-heading)" }}>
              {section.title}
            </h2>
            {cfg.body && (
              <div className="lb-editorial__body">
                <ReactMarkdown>{cfg.body}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="lb-editorial__split"
          style={{ flexDirection: imgPos === "left" ? "row" : "row-reverse" }}
        >
          <div className="lb-editorial__image-col">
            {cfg.media_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cfg.media_url} alt="" className="lb-editorial__img" />
            ) : (
              <div className="lb-editorial__img-placeholder" />
            )}
          </div>
          <div className="lb-editorial__text-col">
            <h2 className="lb-editorial__heading" style={{ fontFamily: "var(--brand-font-heading)" }}>
              {section.title}
            </h2>
            {cfg.body && (
              <div className="lb-editorial__body">
                <ReactMarkdown>{cfg.body}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

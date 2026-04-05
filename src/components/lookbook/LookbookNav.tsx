"use client";

import { useState, useEffect } from "react";
import type { TemplateDefinition } from "@/lib/templates/types";

interface LookbookNavProps {
  title: string;
  logoUrl?: string;
  brandName: string;
  template: TemplateDefinition;
}

export default function LookbookNav({
  title,
  logoUrl,
  brandName,
  template,
}: LookbookNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isFloating = template.navStyle === "floating";
  const isMinimal  = template.navStyle === "minimal";

  return (
    <header
      className={`lb-nav${scrolled ? " lb-nav--scrolled" : ""}${isFloating ? " lb-nav--floating" : ""}${isMinimal ? " lb-nav--minimal" : ""}`}
      style={{ fontFamily: "var(--brand-font-heading)" }}
    >
      <div className="lb-nav__inner">
        {/* Logo / brand name */}
        <a href="#" className="lb-nav__brand">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brandName} className="lb-nav__logo" />
          ) : (
            <span className="lb-nav__brand-name">{brandName}</span>
          )}
        </a>

        {!isMinimal && (
          <span className="lb-nav__title">{title}</span>
        )}

        {/* Right: scroll progress bar (line) */}
        <ScrollLine />
      </div>
    </header>
  );
}

function ScrollLine() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const h = el.scrollHeight - el.clientHeight;
      if (h > 0) setPct((window.scrollY / h) * 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lb-nav__progress">
      <div className="lb-nav__progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

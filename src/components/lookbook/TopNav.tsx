"use client";

import { useTenant } from "@/lib/tenant-context";
import { useFilter } from "@/lib/filter-context";
import { useState } from "react";

interface TopNavProps {
  /** Override tenant branding for preview purposes */
  logoUrl?: string;
  tenantName?: string;
}

export default function TopNav({ logoUrl, tenantName }: TopNavProps) {
  const tenant = useTenant();
  const { filter, setSearch } = useFilter();
  const [searchOpen, setSearchOpen] = useState(false);

  const logo = logoUrl ?? tenant.branding.logo_url;
  const name = tenantName ?? tenant.name;

  return (
    <nav className="top-nav" aria-label="Lookbook navigation">
      <div className="top-nav__logo">
        {logo ? (
          <img src={logo} alt={name} className="top-nav__logo-img" />
        ) : (
          <span className="top-nav__logo-text">{name}</span>
        )}
      </div>

      <div className="top-nav__actions">
        {/* Search toggle */}
        <button
          className="top-nav__btn"
          aria-label="Search products"
          onClick={() => setSearchOpen(s => !s)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11.5 11.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Inline search input */}
      {searchOpen && (
        <div className="top-nav__search">
          <input
            autoFocus
            type="search"
            placeholder="Search products…"
            value={filter.search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Escape" && setSearchOpen(false)}
            className="top-nav__search-input"
          />
        </div>
      )}
    </nav>
  );
}

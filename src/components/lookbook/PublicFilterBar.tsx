"use client";

import { useLookbookFilter } from "@/lib/lookbook-filter-context";

interface PublicFilterBarProps {
  categories: string[];
}

export default function PublicFilterBar({ categories }: PublicFilterBarProps) {
  const { filter, setCategory, clear, isActive } = useLookbookFilter();

  return (
    <div className="lb-fbar">
      <div className="lb-fbar__group">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            className={`lb-fbar__pill${filter.category === cat ? " lb-fbar__pill--on" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {isActive && (
        <>
          <div className="lb-fbar__divider" />
          <button type="button" className="lb-fbar__clear" onClick={clear}>
            Clear
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

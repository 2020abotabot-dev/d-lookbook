"use client";

// ── Public lookbook filter context ────────────────────────────────────────────
// Manages:
//   1. Search / category / tag filter (filter bar at top)
//   2. Per-product visibility toggling (hamburger menu product panel)

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode
} from "react";
import type { DbProduct } from "@/types/database";

interface LookbookFilterState {
  search:   string;
  category: string;
  tag:      string;
}

interface LookbookFilterCtx {
  // ── filter bar ───────────────────────────────────────────────
  filter:      LookbookFilterState;
  setSearch:   (v: string) => void;
  setCategory: (v: string) => void;
  toggleTag:   (v: string) => void;
  clear:       () => void;
  isActive:    boolean;

  // ── visibility toggles ───────────────────────────────────────
  hiddenIds:             Set<string>;
  isProductHidden:       (id: string) => boolean;
  toggleProductHidden:   (id: string) => void;
  setCategoryHidden:     (cat: string, ids: string[], hidden: boolean) => void;
  isCategoryFullyHidden: (ids: string[]) => boolean;
  isCategoryPartialHidden:(ids: string[]) => boolean;   // some but not all hidden
  showAll:               () => void;

  // ── combined visibility ──────────────────────────────────────
  isVisible: (p: DbProduct) => boolean;
}

const LS_KEY = "dlookbook-hidden";
const EMPTY: LookbookFilterState = { search: "", category: "", tag: "" };
const Ctx = createContext<LookbookFilterCtx | null>(null);

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveHidden(s: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...s])); } catch {}
}

export function LookbookFilterProvider({
  children,
  initialHiddenIds,
  readOnly = false,
}: {
  children:         ReactNode;
  initialHiddenIds?: string[];
  readOnly?:         boolean;
}) {
  const [filter,    setFilter]    = useState<LookbookFilterState>(EMPTY);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(
    initialHiddenIds ? new Set(initialHiddenIds) : new Set()
  );

  // Hydrate from localStorage — skip in buyer/readOnly mode (use URL state instead)
  useEffect(() => {
    if (readOnly || initialHiddenIds) return;
    setHiddenIds(loadHidden());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── filter bar ───────────────────────────────────────────────
  const setSearch   = useCallback((v: string) => setFilter(f => ({ ...f, search: v })), []);
  const setCategory = useCallback((v: string) => setFilter(f => ({ ...f, category: f.category === v ? "" : v })), []);
  const toggleTag   = useCallback((v: string) => setFilter(f => ({ ...f, tag: f.tag === v ? "" : v })), []);
  const clear       = useCallback(() => setFilter(EMPTY), []);
  const isActive    = filter.search !== "" || filter.category !== "" || filter.tag !== "";

  // ── visibility ───────────────────────────────────────────────
  const isProductHidden = useCallback((id: string) => hiddenIds.has(id), [hiddenIds]);

  const toggleProductHidden = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveHidden(next);
      return next;
    });
  }, []);

  const setCategoryHidden = useCallback((cat: string, ids: string[], hidden: boolean) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (hidden) { ids.forEach(id => next.add(id)); }
      else        { ids.forEach(id => next.delete(id)); }
      saveHidden(next);
      return next;
    });
  }, []);

  const isCategoryFullyHidden  = useCallback((ids: string[]) =>
    ids.length > 0 && ids.every(id => hiddenIds.has(id)), [hiddenIds]);

  const isCategoryPartialHidden = useCallback((ids: string[]) => {
    const hidden = ids.filter(id => hiddenIds.has(id));
    return hidden.length > 0 && hidden.length < ids.length;
  }, [hiddenIds]);

  const showAll = useCallback(() => {
    setHiddenIds(new Set());
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  // ── combined isVisible ───────────────────────────────────────
  const isVisible = useCallback((p: DbProduct): boolean => {
    if (hiddenIds.has(p.id)) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (filter.category && p.category !== filter.category) return false;
    if (filter.tag && !p.tags.includes(filter.tag)) return false;
    return true;
  }, [filter, hiddenIds]);

  return (
    <Ctx.Provider value={{
      filter, setSearch, setCategory, toggleTag, clear, isActive,
      hiddenIds, isProductHidden, toggleProductHidden, setCategoryHidden,
      isCategoryFullyHidden, isCategoryPartialHidden, showAll,
      isVisible,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLookbookFilter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLookbookFilter must be used inside LookbookFilterProvider");
  return ctx;
}

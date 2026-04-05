"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Product } from "@/types/lookbook";

interface FilterState {
  search: string;
  activity: string;
  protection: string;
  gender: string;
}

interface FilterCtx {
  filter: FilterState;
  setSearch: (v: string) => void;
  toggleActivity: (v: string) => void;
  toggleProtection: (v: string) => void;
  toggleGender: (v: string) => void;
  clear: () => void;
  isActive: boolean;
  isProductVisible: (p: Product) => boolean;
}

const EMPTY: FilterState = { search: "", activity: "", protection: "", gender: "" };
const Ctx = createContext<FilterCtx | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<FilterState>(EMPTY);

  const setSearch       = useCallback((v: string) => setFilter(f => ({ ...f, search: v })), []);
  const toggleActivity   = useCallback((v: string) => setFilter(f => ({ ...f, activity:   f.activity   === v ? "" : v })), []);
  const toggleProtection = useCallback((v: string) => setFilter(f => ({ ...f, protection: f.protection === v ? "" : v })), []);
  const toggleGender     = useCallback((v: string) => setFilter(f => ({ ...f, gender:     f.gender     === v ? "" : v })), []);
  const clear = useCallback(() => setFilter(EMPTY), []);

  const isActive =
    filter.search !== "" ||
    filter.activity !== "" ||
    filter.protection !== "" ||
    filter.gender !== "";

  const isProductVisible = useCallback((p: Product): boolean => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!p.patternName.toLowerCase().includes(q)) return false;
    }
    if (filter.activity && p.activityType !== filter.activity) return false;
    if (filter.protection === "GTX"     && p.protection !== "GTX") return false;
    if (filter.protection === "Non-GTX" && p.protection === "GTX") return false;
    if (filter.gender && p.gender !== filter.gender) return false;
    return true;
  }, [filter]);

  return (
    <Ctx.Provider value={{
      filter, setSearch, toggleActivity, toggleProtection, toggleGender,
      clear, isActive, isProductVisible,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFilter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilter must be used inside FilterProvider");
  return ctx;
}

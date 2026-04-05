"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { DbProduct } from "@/types/database";

interface AssortmentCtx {
  selections:  Map<string, DbProduct>;
  toggle:      (product: DbProduct) => void;
  isSelected:  (id: string) => boolean;
  clear:       () => void;
  count:       number;
}

const Ctx = createContext<AssortmentCtx>({
  selections:  new Map(),
  toggle:      () => {},
  isSelected:  () => false,
  clear:       () => {},
  count:       0,
});

const LS_KEY = "dlookbook-assortment";

function save(map: Map<string, DbProduct>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...map.values()]));
  } catch {}
}

function load(): Map<string, DbProduct> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as DbProduct[];
    return new Map(arr.map(p => [p.id, p]));
  } catch {
    return new Map();
  }
}

export function AssortmentProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<Map<string, DbProduct>>(new Map());
  const hydrated = useRef(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setSelections(load());
  }, []);

  const toggle = useCallback((product: DbProduct) => {
    setSelections(prev => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, product);
      }
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelections(new Map());
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  const isSelected = useCallback((id: string) => selections.has(id), [selections]);

  return (
    <Ctx.Provider value={{ selections, toggle, isSelected, clear, count: selections.size }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAssortment() { return useContext(Ctx); }

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface SelectedItem {
  material: string;       // SKU — unique key
  colour: string;
  productName: string;
  gender: string;
  collectionName: string;
  territoryName: string;
  imageSrc: string | null;
  emea_key_story: boolean;
}

interface AssortmentCtx {
  selections: Map<string, SelectedItem>;
  toggle: (item: SelectedItem) => void;
  isSelected: (material: string) => boolean;
  clear: () => void;
  count: number;
}

const Ctx = createContext<AssortmentCtx | null>(null);

// localStorage key namespaced by tenantId + lookbookId to prevent cross-tenant bleed
function storageKey(tenantId: string, lookbookId: string) {
  return `dlookbook-assortment:${tenantId}:${lookbookId}`;
}

function load(key: string): Map<string, SelectedItem> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const arr: SelectedItem[] = JSON.parse(raw);
    return new Map(arr.map(i => [i.material, i]));
  } catch {
    return new Map();
  }
}

function save(key: string, map: Map<string, SelectedItem>) {
  try {
    localStorage.setItem(key, JSON.stringify([...map.values()]));
  } catch {}
}

interface AssortmentProviderProps {
  children: React.ReactNode;
  tenantId: string;
  lookbookId: string;
}

export function AssortmentProvider({ children, tenantId, lookbookId }: AssortmentProviderProps) {
  const key = storageKey(tenantId, lookbookId);
  const [selections, setSelections] = useState<Map<string, SelectedItem>>(new Map());

  useEffect(() => {
    setSelections(load(key));
  }, [key]);

  const toggle = useCallback((item: SelectedItem) => {
    setSelections(prev => {
      const next = new Map(prev);
      if (next.has(item.material)) {
        next.delete(item.material);
      } else {
        next.set(item.material, item);
      }
      save(key, next);
      return next;
    });
  }, [key]);

  const isSelected = useCallback(
    (material: string) => selections.has(material),
    [selections]
  );

  const clear = useCallback(() => {
    setSelections(new Map());
    try { localStorage.removeItem(key); } catch {}
  }, [key]);

  return (
    <Ctx.Provider value={{ selections, toggle, isSelected, clear, count: selections.size }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAssortment() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAssortment must be used inside AssortmentProvider");
  return ctx;
}

"use client";

import { createContext, useCallback, useContext, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface SelectionCtx {
  hiddenTerritories: Set<string>;
  hiddenCollections: Set<string>;
  hiddenProducts:    Set<string>;
  hiddenColorways:   Set<string>;

  toggleTerritory:  (id: string) => void;
  toggleCollection: (id: string) => void;
  toggleProduct:    (key: string) => void;
  toggleColorway:   (key: string) => void;

  setTerritoryVisible:  (id: string, visible: boolean) => void;
  setCollectionVisible: (id: string, visible: boolean) => void;

  isTerritoryVisible:  (id: string) => boolean;
  isCollectionVisible: (id: string) => boolean;
  isProductVisible:    (key: string) => boolean;
  isColorwayVisible:   (key: string) => boolean;

  isLoaded: boolean;
}

const Ctx = createContext<SelectionCtx | null>(null);

type SelectionsRow = {
  hidden_territories: string[];
  hidden_collections: string[];
  hidden_products:    string[];
  hidden_colorways:   string[];
};

// localStorage helpers — namespaced by tenantId to avoid cross-tenant collisions
function lsKey(tenantId: string, userId: string) {
  return `dlookbook-selections:${tenantId}:${userId}`;
}
const LS_LAST_UID = "dlookbook-last-uid";

function saveToLocal(tenantId: string, userId: string, row: SelectionsRow) {
  try { localStorage.setItem(lsKey(tenantId, userId), JSON.stringify(row)); } catch {}
}

function loadFromLocal(tenantId: string, userId: string): SelectionsRow | null {
  try {
    const raw = localStorage.getItem(lsKey(tenantId, userId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function loadFromSupabase(userId: string, lookbookId: string): Promise<SelectionsRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lookbook_user_selections")
    .select("hidden_territories, hidden_collections, hidden_products, hidden_colorways")
    .eq("user_id", userId)
    .eq("lookbook_id", lookbookId)
    .single();
  if (error || !data) return null;
  return data as SelectionsRow;
}

async function saveToSupabase(userId: string, lookbookId: string, tenantId: string, row: SelectionsRow) {
  const supabase = createClient();
  await supabase
    .from("lookbook_user_selections")
    .upsert({
      user_id: userId,
      lookbook_id: lookbookId,
      tenant_id: tenantId,
      ...row,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,lookbook_id" });
}

interface SelectionProviderProps {
  children: React.ReactNode;
  tenantId: string;
  lookbookId: string;
  initialSelections?: SelectionsRow;
  readOnly?: boolean;
}

export function SelectionProvider({
  children,
  tenantId,
  lookbookId,
  initialSelections,
  readOnly = false,
}: SelectionProviderProps) {
  const [hiddenTerritories, setHiddenTerritories] = useState<Set<string>>(
    new Set(initialSelections?.hidden_territories ?? [])
  );
  const [hiddenCollections,  setHiddenCollections]  = useState<Set<string>>(
    new Set(initialSelections?.hidden_collections ?? [])
  );
  const [hiddenProducts,     setHiddenProducts]     = useState<Set<string>>(
    new Set(initialSelections?.hidden_products ?? [])
  );
  const [hiddenColorways,    setHiddenColorways]    = useState<Set<string>>(
    new Set(initialSelections?.hidden_colorways ?? [])
  );
  const [isLoaded, setIsLoaded] = useState(!!initialSelections);

  const userIdRef  = useRef<string | null>(null);
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSave   = useRef(true);

  useEffect(() => {
    if (initialSelections || readOnly) return;

    const supabase = createClient();

    supabase.auth.getUser()
      .then(async ({ data: { user } }) => {
        if (!user) { setIsLoaded(true); return; }
        userIdRef.current = user.id;
        try { localStorage.setItem(LS_LAST_UID, user.id); } catch {}

        let row = await loadFromSupabase(user.id, lookbookId).catch(() => null);
        if (!row) row = loadFromLocal(tenantId, user.id);

        if (row) {
          saveToLocal(tenantId, user.id, row);
          setHiddenTerritories(new Set(row.hidden_territories));
          setHiddenCollections(new Set(row.hidden_collections));
          setHiddenProducts(new Set(row.hidden_products));
          setHiddenColorways(new Set(row.hidden_colorways));
        }

        skipSave.current = false;
        setIsLoaded(true);
      })
      .catch(() => {
        try {
          const uid = localStorage.getItem(LS_LAST_UID);
          if (uid) {
            userIdRef.current = uid;
            const row = loadFromLocal(tenantId, uid);
            if (row) {
              setHiddenTerritories(new Set(row.hidden_territories));
              setHiddenCollections(new Set(row.hidden_collections));
              setHiddenProducts(new Set(row.hidden_products));
              setHiddenColorways(new Set(row.hidden_colorways));
            }
          }
        } catch {}
        skipSave.current = false;
        setIsLoaded(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (readOnly || skipSave.current || !userIdRef.current) return;

    const row: SelectionsRow = {
      hidden_territories: Array.from(hiddenTerritories),
      hidden_collections: Array.from(hiddenCollections),
      hidden_products:    Array.from(hiddenProducts),
      hidden_colorways:   Array.from(hiddenColorways),
    };

    saveToLocal(tenantId, userIdRef.current, row);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!userIdRef.current) return;
      saveToSupabase(userIdRef.current, lookbookId, tenantId, row);
    }, 600);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [hiddenTerritories, hiddenCollections, hiddenProducts, hiddenColorways]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    setter(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  const toggleTerritory  = useCallback((id: string) => toggle(setHiddenTerritories, id), []);
  const toggleCollection = useCallback((id: string) => toggle(setHiddenCollections, id), []);
  const toggleProduct    = useCallback((key: string) => toggle(setHiddenProducts, key), []);
  const toggleColorway   = useCallback((key: string) => toggle(setHiddenColorways, key), []);

  const setTerritoryVisible = useCallback((id: string, visible: boolean) =>
    setHiddenTerritories(prev => { const next = new Set(prev); visible ? next.delete(id) : next.add(id); return next; }), []);

  const setCollectionVisible = useCallback((id: string, visible: boolean) =>
    setHiddenCollections(prev => { const next = new Set(prev); visible ? next.delete(id) : next.add(id); return next; }), []);

  const isTerritoryVisible  = useCallback((id: string) => !hiddenTerritories.has(id), [hiddenTerritories]);
  const isCollectionVisible = useCallback((id: string) => !hiddenCollections.has(id), [hiddenCollections]);
  const isProductVisible    = useCallback((key: string) => !hiddenProducts.has(key), [hiddenProducts]);
  const isColorwayVisible   = useCallback((key: string) => !hiddenColorways.has(key), [hiddenColorways]);

  return (
    <Ctx.Provider value={{
      hiddenTerritories, hiddenCollections, hiddenProducts, hiddenColorways,
      toggleTerritory, toggleCollection, toggleProduct, toggleColorway,
      setTerritoryVisible, setCollectionVisible,
      isTerritoryVisible, isCollectionVisible, isProductVisible, isColorwayVisible,
      isLoaded,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSelection must be used inside SelectionProvider");
  return ctx;
}

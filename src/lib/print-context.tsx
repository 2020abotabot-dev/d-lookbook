"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface PrintCtx {
  isPrinting:   boolean;
  buyerName:    string;
  setBuyerName: (name: string) => void;
  triggerPrint: () => void;
  cancelPrint:  () => void;
}

const Ctx = createContext<PrintCtx>({
  isPrinting:   false,
  buyerName:    "",
  setBuyerName: () => {},
  triggerPrint: () => {},
  cancelPrint:  () => {},
});

export function PrintProvider({ children }: { children: React.ReactNode }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [buyerName,  setBuyerName]  = useState("");

  const triggerPrint = useCallback(() => {
    setIsPrinting(true);
    // Double rAF gives React time to re-render the print layout before print dialog opens
    setTimeout(() => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          window.print();
          setIsPrinting(false);
        })
      );
    }, 300);
  }, []);

  const cancelPrint = useCallback(() => setIsPrinting(false), []);

  return (
    <Ctx.Provider value={{ isPrinting, buyerName, setBuyerName, triggerPrint, cancelPrint }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePrint() { return useContext(Ctx); }

"use client";

import { createContext, useContext } from "react";
import type { TenantConfig } from "@/types/tenant";

const Ctx = createContext<TenantConfig | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantConfig;
  children: React.ReactNode;
}) {
  return (
    <Ctx.Provider value={tenant}>
      {/* Inject tenant CSS variables so all lookbook components can use them */}
      <style>{`
        :root {
          --tenant-primary:   ${tenant.branding.primary_color};
          --tenant-secondary: ${tenant.branding.secondary_color};
          --tenant-accent:    ${tenant.branding.accent_color};
          --tenant-font-heading: ${tenant.branding.font_heading};
          --tenant-font-body:    ${tenant.branding.font_body};
        }
      `}</style>
      {children}
    </Ctx.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider");
  return ctx;
}

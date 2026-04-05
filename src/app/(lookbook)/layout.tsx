import type { Metadata } from "next";
import LenisProvider from "@/components/lookbook/LenisProvider";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: { template: "%s — DLookBook", default: "DLookBook" },
};

// PWA manifest link is injected per-tenant in the page, not here.
// Layout is kept minimal — no platform chrome.

export default async function LookbookLayout({ children }: { children: React.ReactNode }) {
  // Detect tenant slug from x-tenant-slug header (set by middleware for subdomain requests)
  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") ?? null;

  return (
    <LenisProvider>
      {children}
      {/* Per-tenant service worker registration */}
      {tenantSlug && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/api/sw/${tenantSlug}', { scope: '/' })
      .catch(function(err) { console.warn('SW registration failed:', err); });
  });
}`,
          }}
        />
      )}
    </LenisProvider>
  );
}

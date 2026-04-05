import { NextRequest, NextResponse } from "next/server";

// Per-tenant service worker — served as JS with the correct Content-Type.
// Scope is /, so the SW controls the full lookbook page for this tenant.
//
// Strategy:
//   - HTML (navigate): Network-first, fall back to cache
//   - Same-origin assets: Cache-first, async background update
//   - Product images: Cache-first (support offline at trade shows)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const cacheVersion   = `dlb-${tenantSlug}-v1`;

  const swScript = `
const CACHE = '${cacheVersion}';
const PRECACHE = ['/'];

// Install — precache root
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — purge old caches for this tenant
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('dlb-${tenantSlug}-') && k !== CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin
  if (url.origin !== location.origin) return;

  // Navigation (HTML) — network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Assets + images — cache first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Stale-while-revalidate
        fetch(request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(request, res));
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
        }
        return res;
      });
    })
  );
});
`;

  return new NextResponse(swScript, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache", // SW itself must never be stale
      "Service-Worker-Allowed": "/",
    },
  });
}

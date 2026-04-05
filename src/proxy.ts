import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ── DLookBook Middleware ───────────────────────────────────────────────────────
//
// 1. Subdomain routing:
//    demo-brand.dlookbook.com/ → rewrite to /demo-brand
//    demo-brand.dlookbook.com/lookbook/[id] → rewrite to /demo-brand/lookbook/[id]
//    custom-domain.com/ → set x-tenant-slug via custom domain lookup (future)
//
// 2. Supabase session refresh for platform routes.

export async function proxy(request: NextRequest) {
  const { hostname, pathname } = new URL(request.url);

  // Skip static files and API routes from subdomain rewrite
  const isStaticOrInternal =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

  // ── Subdomain detection ──────────────────────────────────────────────────
  const isDlookbookHost = hostname.endsWith(".dlookbook.com");
  const isSubdomain =
    isDlookbookHost &&
    hostname !== "dlookbook.com" &&
    hostname !== "www.dlookbook.com";

  if (isSubdomain && !isStaticOrInternal) {
    const tenantSlug = hostname.replace(".dlookbook.com", "");

    // Rewrite to /(lookbook)/[slug]/...
    const url = request.nextUrl.clone();
    url.pathname = `/${tenantSlug}${pathname === "/" ? "" : pathname}`;

    const response = NextResponse.rewrite(url);
    response.headers.set("x-tenant-slug", tenantSlug);
    return response;
  }

  // ── Custom domain support (future) ────────────────────────────────────────
  // If the request is not *.dlookbook.com and not localhost, it might be a
  // custom domain. Look up the tenant by custom_domain field.
  // This is left as a stub — enable when custom domains are implemented.

  // ── Platform route session refresh ────────────────────────────────────────
  // Keep Supabase auth cookies refreshed for all platform routes.
  // Public lookbook routes are unprotected — skip auth middleware for them.
  const isPlatformRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/builder");

  if (isPlatformRoute) {
    const { response } = await updateSession(request);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};

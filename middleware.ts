import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// ── Constants ──────────────────────────────────────────────────────────────────

const TEST_MODE     = process.env.NEXT_PUBLIC_TEST_MODE === "true";
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "dlookbook.com";
const PLATFORM_ROUTES  = ["/dashboard", "/settings", "/products", "/builder"];
const PUBLIC_ROUTES    = ["/login", "/signup", "/auth"];

// ── Tenant resolution ─────────────────────────────────────────────────────────

async function resolveTenantFromSlug(slug: string): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  const { data } = await supabase.from("tenants").select("id").eq("slug", slug).single();
  return data?.id ?? null;
}

async function resolveTenantFromDomain(domain: string): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  const { data } = await supabase.from("tenants").select("id").eq("custom_domain", domain).single();
  return data?.id ?? null;
}

// ── Middleware ─────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // ── TEST MODE: skip all Supabase calls, allow everything ──────────────────
  if (TEST_MODE) {
    const response = NextResponse.next({ request });
    response.headers.set("x-test-mode", "true");
    // In test mode, treat all users as authenticated on platform routes
    // but still allow login/signup to redirect to dashboard for the demo flow
    if (pathname === "/login" || pathname === "/signup") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // ── Production flow ───────────────────────────────────────────────────────

  // 1. Refresh Supabase session
  const { response, userId } = await updateSession(request);

  // 2. Determine context from hostname
  const isPlatformDomain = hostname === PLATFORM_DOMAIN || hostname.startsWith("localhost");

  if (!isPlatformDomain) {
    let tenantId: string | null = null;

    if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
      const slug = hostname.slice(0, -(`.${PLATFORM_DOMAIN}`.length));
      tenantId = await resolveTenantFromSlug(slug);
    } else {
      tenantId = await resolveTenantFromDomain(hostname);
    }

    if (!tenantId) {
      return NextResponse.redirect(new URL("/", `https://${PLATFORM_DOMAIN}`));
    }

    response.headers.set("x-tenant-id", tenantId);
    return response;
  }

  // ── Platform domain ───────────────────────────────────────────────────────

  const isPublicRoute   = PUBLIC_ROUTES.some(r => pathname.startsWith(r));
  const isPlatformRoute = PLATFORM_ROUTES.some(r => pathname.startsWith(r));

  if (!userId && isPlatformRoute && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (userId && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)",
  ],
};

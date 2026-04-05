import { NextRequest, NextResponse } from "next/server";
import { TEST_MODE } from "@/lib/test-mode";
import { MOCK_TENANT } from "@/lib/mock/data";
import { createServiceClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  let name    = "DLookBook";
  let slug    = "dlookbook";
  let primary = "#111111";
  let faviconUrl: string | null = null;

  if (TEST_MODE) {
    name    = MOCK_TENANT.name;
    slug    = MOCK_TENANT.slug;
    primary = MOCK_TENANT.branding.primary_color;
  } else {
    const service = createServiceClient();
    const { data } = await service
      .from("tenants")
      .select("name, slug, branding")
      .eq("id", tenantId)
      .single();

    if (data) {
      name       = data.name;
      slug       = data.slug;
      primary    = data.branding?.primary_color ?? "#111111";
      faviconUrl = data.branding?.favicon_url ?? null;
    }
  }

  const manifest = {
    name,
    short_name: name,
    description: `${name} digital lookbook`,
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: primary,
    icons: faviconUrl
      ? [
          { src: faviconUrl, sizes: "192x192", type: "image/png" },
          { src: faviconUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ]
      : [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
    id: `/${slug}`,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

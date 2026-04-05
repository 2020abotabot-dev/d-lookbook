import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Called by publishLookbook() server action to invalidate the ISR cache.
// Protected by a shared secret to prevent abuse.

const SECRET = process.env.REVALIDATE_SECRET ?? "dev-revalidate-secret";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    secret?:     string;
    tag?:        string;
    path?:       string;
    tenantSlug?: string;
  };

  if (body.secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Revalidate tag via path (revalidateTag requires cache tags to be set at fetch time)

  if (body.path) {
    revalidatePath(body.path);
  }

  // Also revalidate the tenant slug path
  if (body.tenantSlug) {
    revalidatePath(`/${body.tenantSlug}`);
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}

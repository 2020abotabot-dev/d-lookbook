import { NextRequest, NextResponse } from "next/server";
import { TEST_MODE } from "@/lib/test-mode";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (TEST_MODE) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await req.json() as {
      tenant_id:   string;
      lookbook_id: string;
      event_type:  string;
      product_id:  string | null;
      session_id:  string;
      metadata:    Record<string, unknown>;
    };

    // Basic validation
    if (!body.tenant_id || !body.lookbook_id || !body.event_type || !body.session_id) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const service = createServiceClient();
    await service.from("analytics_events").insert({
      tenant_id:   body.tenant_id,
      lookbook_id: body.lookbook_id,
      event_type:  body.event_type,
      product_id:  body.product_id ?? null,
      session_id:  body.session_id,
      metadata:    body.metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

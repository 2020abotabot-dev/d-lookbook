import { NextRequest, NextResponse } from "next/server";
import { TEST_MODE } from "@/lib/test-mode";
import { getAIClient, AI_MODELS, extractJSON } from "@/lib/ai/client";
import { LAYOUT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { GeneratedLayoutSchema } from "@/lib/ai/schemas";
import { checkAIRateLimit, incrementAIUsage } from "@/lib/ai/rate-limit";
import { createClient } from "@/lib/supabase/server";

// POST /api/ai/generate-layout
// Body: { description: string, tenantId: string }
export async function POST(req: NextRequest) {
  if (TEST_MODE) {
    return NextResponse.json({
      title:    "Test Layout",
      sections: [
        {
          id:          "mock-sec-1",
          type:        "hero",
          title:       "Hero",
          description: "AI-generated hero section",
          sort_order:  0,
          config:      { headline: "Feel the Difference", subline: "SS27 Collection", overlay_opacity: 0.4 },
        },
        {
          id:          "mock-sec-2",
          type:        "product_grid",
          title:       "New Arrivals",
          description: "Featured products",
          sort_order:  1,
          config:      { layout: "3col", filter_enabled: true },
        },
      ],
    });
  }

  try {
    const body = await req.json() as { description?: string; tenantId?: string };
    if (!body.description || !body.tenantId) {
      return NextResponse.json({ error: "Missing description or tenantId" }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // Plan lookup
    const service = (await import("@/lib/supabase/server")).createServiceClient();
    const { data: tenant } = await service
      .from("tenants")
      .select("plan")
      .eq("id", body.tenantId)
      .single();

    const plan = tenant?.plan ?? "starter";

    // Rate limit check
    const { allowed, reason } = await checkAIRateLimit(body.tenantId, plan);
    if (!allowed) {
      return NextResponse.json({ error: reason }, { status: 429 });
    }

    const client = getAIClient();
    const response = await client.messages.create({
      model:      AI_MODELS.complex,
      max_tokens: 2048,
      system:     LAYOUT_SYSTEM_PROMPT,
      messages: [
        {
          role:    "user",
          content: `Generate a lookbook layout for: ${body.description}`,
        },
      ],
    });

    const rawText = response.content.find(b => b.type === "text")?.text ?? "";
    const parsed = JSON.parse(extractJSON(rawText));
    const result = GeneratedLayoutSchema.parse(parsed);

    await incrementAIUsage(body.tenantId);

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-layout error:", msg);
    return NextResponse.json({ error: `AI generation failed: ${msg}` }, { status: 500 });
  }
}

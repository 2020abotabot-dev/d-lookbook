import { NextRequest, NextResponse } from "next/server";
import { TEST_MODE } from "@/lib/test-mode";
import { getAIClient, AI_MODELS, extractJSON } from "@/lib/ai/client";
import { COPY_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { GeneratedCopySchema } from "@/lib/ai/schemas";
import { checkAIRateLimit, incrementAIUsage } from "@/lib/ai/rate-limit";
import { createClient } from "@/lib/supabase/server";

// POST /api/ai/generate-copy
// Body: { productName: string, features: string[], category: string, tenantId: string }
export async function POST(req: NextRequest) {
  if (TEST_MODE) {
    return NextResponse.json({
      short: "Built for the trail ahead. Responsive cushioning meets relentless grip.",
      long:  "Engineered with FloatPro foam and Vibram® outsole technology, these shoes deliver all-day energy return on technical terrain. The breathable upper keeps feet cool without sacrificing structure — ideal for long mountain days.",
    });
  }

  try {
    const body = await req.json() as {
      productName?: string;
      features?:    string[];
      category?:    string;
      tenantId?:    string;
    };

    if (!body.productName || !body.tenantId) {
      return NextResponse.json({ error: "Missing productName or tenantId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const service = (await import("@/lib/supabase/server")).createServiceClient();
    const { data: tenant } = await service
      .from("tenants")
      .select("plan")
      .eq("id", body.tenantId)
      .single();

    const { allowed, reason } = await checkAIRateLimit(body.tenantId, tenant?.plan ?? "starter");
    if (!allowed) return NextResponse.json({ error: reason }, { status: 429 });

    const client = getAIClient();
    const featuresText = body.features?.length
      ? `\nKey features: ${body.features.join(", ")}`
      : "";
    const categoryText = body.category ? `\nCategory: ${body.category}` : "";

    const response = await client.messages.create({
      model:      AI_MODELS.fast,
      max_tokens: 512,
      system:     COPY_SYSTEM_PROMPT,
      messages: [
        {
          role:    "user",
          content: `Product: ${body.productName}${categoryText}${featuresText}`,
        },
      ],
    });

    const rawText = response.content.find(b => b.type === "text")?.text ?? "";
    const result = GeneratedCopySchema.parse(JSON.parse(extractJSON(rawText)));

    await incrementAIUsage(body.tenantId);

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-copy error:", msg);
    return NextResponse.json({ error: `AI generation failed: ${msg}` }, { status: 500 });
  }
}

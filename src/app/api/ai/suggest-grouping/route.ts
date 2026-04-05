import { NextRequest, NextResponse } from "next/server";
import { TEST_MODE } from "@/lib/test-mode";
import { getAIClient, AI_MODELS } from "@/lib/ai/client";
import { GROUPING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { GeneratedGroupingSchema } from "@/lib/ai/schemas";
import { checkAIRateLimit, incrementAIUsage } from "@/lib/ai/rate-limit";
import { createClient } from "@/lib/supabase/server";

interface ProductSummary {
  id:       string;
  name:     string;
  category: string;
  tags?:    string[];
  price?:   number;
}

// POST /api/ai/suggest-grouping
// Body: { products: ProductSummary[], tenantId: string }
export async function POST(req: NextRequest) {
  if (TEST_MODE) {
    return NextResponse.json({
      groups: [
        {
          title:        "Trail Running Heroes",
          section_type: "product_grid",
          rationale:    "Core trail running footwear grouped by activity for focused browsing.",
          product_ids:  ["mock-p-001", "mock-p-002"],
        },
        {
          title:        "The Hike Collection",
          section_type: "product_grid",
          rationale:    "Hiking-specific styles grouped together to serve a distinct customer intent.",
          product_ids:  ["mock-p-003", "mock-p-004"],
        },
      ],
    });
  }

  try {
    const body = await req.json() as { products?: ProductSummary[]; tenantId?: string };

    if (!body.products?.length || !body.tenantId) {
      return NextResponse.json({ error: "Missing products or tenantId" }, { status: 400 });
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
    const productList = body.products
      .map(p => `- ID: ${p.id} | Name: ${p.name} | Category: ${p.category}${p.tags?.length ? ` | Tags: ${p.tags.join(", ")}` : ""}${p.price != null ? ` | Price: €${p.price}` : ""}`)
      .join("\n");

    const response = await client.messages.create({
      model:      AI_MODELS.fast,
      max_tokens: 1024,
      system: [
        {
          type:          "text",
          text:          GROUPING_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role:    "user",
          content: `Suggest groupings for this product catalog:\n${productList}`,
        },
      ],
    });

    const rawText = response.content.find(b => b.type === "text")?.text ?? "";
    const result = GeneratedGroupingSchema.parse(JSON.parse(rawText));

    await incrementAIUsage(body.tenantId);

    return NextResponse.json(result);
  } catch (err) {
    console.error("suggest-grouping error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}

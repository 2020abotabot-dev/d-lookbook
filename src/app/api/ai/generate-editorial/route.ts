import { NextRequest, NextResponse } from "next/server";
import { TEST_MODE } from "@/lib/test-mode";
import { getAIClient, AI_MODELS } from "@/lib/ai/client";
import { EDITORIAL_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { GeneratedEditorialSchema } from "@/lib/ai/schemas";
import { checkAIRateLimit, incrementAIUsage } from "@/lib/ai/rate-limit";
import { createClient } from "@/lib/supabase/server";

// POST /api/ai/generate-editorial
// Body: { sectionTitle: string, collectionContext: string, brandTone?: string, tenantId: string }
export async function POST(req: NextRequest) {
  if (TEST_MODE) {
    return NextResponse.json({
      headline: "Where Terrain Meets Design",
      subline:  "Spring/Summer 2027 — The Trail Edit",
      body:     "There are places only the committed reach. Ridgelines at first light, valley floors after rain. This season's edit is built for those who know that the path is the point — pieces that move with intention across every surface, every distance, every condition.",
    });
  }

  try {
    const body = await req.json() as {
      sectionTitle?:      string;
      collectionContext?: string;
      brandTone?:         string;
      tenantId?:          string;
    };

    if (!body.collectionContext || !body.tenantId) {
      return NextResponse.json({ error: "Missing collectionContext or tenantId" }, { status: 400 });
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
    const toneNote = body.brandTone ? `\nBrand tone: ${body.brandTone}` : "";
    const titleNote = body.sectionTitle ? `\nSection title: ${body.sectionTitle}` : "";

    const response = await client.messages.create({
      model:      AI_MODELS.complex,
      max_tokens: 768,
      system: [
        {
          type:          "text",
          text:          EDITORIAL_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role:    "user",
          content: `Collection context: ${body.collectionContext}${titleNote}${toneNote}`,
        },
      ],
    });

    const rawText = response.content.find(b => b.type === "text")?.text ?? "";
    const result = GeneratedEditorialSchema.parse(JSON.parse(rawText));

    await incrementAIUsage(body.tenantId);

    return NextResponse.json(result);
  } catch (err) {
    console.error("generate-editorial error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}

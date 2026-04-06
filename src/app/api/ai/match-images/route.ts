import { NextRequest, NextResponse } from "next/server";
import { TEST_MODE } from "@/lib/test-mode";
import { getAIClient, AI_MODELS, extractJSON } from "@/lib/ai/client";
import { checkAIRateLimit, incrementAIUsage } from "@/lib/ai/rate-limit";
import { createClient } from "@/lib/supabase/server";

// POST /api/ai/match-images
// Body: {
//   filenames:  string[],          — unmatched image filenames
//   products:   { id, sku, name }[], — all tenant products
//   tenantId:   string
// }
// Returns: { matches: { filename, productId, sku, confidence, reason }[] }

interface ProductRef { id: string; sku: string; name: string; }
interface AIMatch { filename: string; productId: string; sku: string; confidence: number; reason: string; }

const SYSTEM_PROMPT = `You are a product data expert matching image filenames to product SKUs.

Given a list of image filenames and a product catalog, identify which product each image belongs to.

Rules:
- Look for J-codes (pattern: J followed by 5-7 digits, e.g. J068225, J500315W) in the filename
- Try normalised matching: ignore hyphens, underscores, spaces, case
- Suffixes like _000, _001, _045, _180, _270, _OUT, _TOP, _DTL indicate view angle — strip these before matching
- confidence: 1.0 = certain, 0.8 = very likely, 0.6 = likely, below 0.5 = skip
- Only include matches with confidence >= 0.6
- If you cannot identify a match with confidence >= 0.6, omit that filename

Output ONLY valid JSON — no markdown fences, no commentary:
{
  "matches": [
    {
      "filename": "exact_filename.jpg",
      "productId": "uuid-from-catalog",
      "sku": "matched-sku",
      "confidence": 0.95,
      "reason": "J068225 extracted from filename matches SKU J068225 exactly"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  if (TEST_MODE) {
    return NextResponse.json({ matches: [] });
  }

  try {
    const body = await req.json() as {
      filenames?: string[];
      products?:  ProductRef[];
      tenantId?:  string;
    };

    if (!body.filenames?.length || !body.products?.length || !body.tenantId) {
      return NextResponse.json({ error: "Missing filenames, products, or tenantId" }, { status: 400 });
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
      .map(p => `{ "id": "${p.id}", "sku": "${p.sku}", "name": "${p.name}" }`)
      .join("\n");

    const filenameList = body.filenames.join("\n");

    const response = await client.messages.create({
      model:      AI_MODELS.fast,
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Unmatched filenames:\n${filenameList}\n\nProduct catalog:\n${productList}`,
        },
      ],
    });

    const rawText = response.content.find(b => b.type === "text")?.text ?? "";
    const parsed  = JSON.parse(extractJSON(rawText)) as { matches: AIMatch[] };

    await incrementAIUsage(body.tenantId);

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("match-images error:", msg);
    return NextResponse.json({ error: `AI matching failed: ${msg}` }, { status: 500 });
  }
}

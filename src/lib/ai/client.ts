import Anthropic from "@anthropic-ai/sdk";

// Singleton Anthropic client
let _client: Anthropic | null = null;

export function getAIClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    });
  }
  return _client;
}

// Model assignments per task complexity
export const AI_MODELS = {
  complex: "claude-opus-4-5-20250514",   // Layout generation, editorial
  fast:    "claude-haiku-4-5-20251001",  // Product copy, grouping suggestions
} as const;

// Rate limits by plan (requests per month)
export const PLAN_LIMITS: Record<string, number> = {
  starter:    20,
  pro:        100,
  enterprise: Infinity,
};

/**
 * Strip markdown code fences from a string and return the raw JSON content.
 * Claude occasionally wraps JSON in ```json ... ``` despite being told not to.
 */
export function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

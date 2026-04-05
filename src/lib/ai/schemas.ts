import { z } from "zod";

// ── Layout Generation ─────────────────────────────────────────────────────────

export const SectionConfigSchema = z.record(z.string(), z.unknown());

export const GeneratedSectionSchema = z.object({
  id:          z.string(),
  type:        z.enum([
    "hero", "product_grid", "editorial", "campaign", "banner",
    // Cinematic
    "video_hero", "horizontal_scroll", "sticky_chapters", "parallax_editorial",
  ]),
  title:       z.string(),
  description: z.string(),
  sort_order:  z.number(),
  config:      SectionConfigSchema,
});

export const GeneratedLayoutSchema = z.object({
  title:    z.string(),
  sections: z.array(GeneratedSectionSchema),
});

export type GeneratedLayout = z.infer<typeof GeneratedLayoutSchema>;

// ── Product Copy ──────────────────────────────────────────────────────────────

export const GeneratedCopySchema = z.object({
  short: z.string(),
  long:  z.string(),
});

export type GeneratedCopy = z.infer<typeof GeneratedCopySchema>;

// ── Editorial Content ─────────────────────────────────────────────────────────

export const GeneratedEditorialSchema = z.object({
  headline: z.string(),
  subline:  z.string(),
  body:     z.string(),
});

export type GeneratedEditorial = z.infer<typeof GeneratedEditorialSchema>;

// ── Product Grouping ──────────────────────────────────────────────────────────

export const GroupSchema = z.object({
  title:        z.string(),
  section_type: z.enum([
    "hero", "product_grid", "editorial", "campaign",
    "horizontal_scroll", "sticky_chapters",
  ]),
  rationale:    z.string(),
  product_ids:  z.array(z.string()),
});

export const GeneratedGroupingSchema = z.object({
  groups: z.array(GroupSchema),
});

export type GeneratedGrouping = z.infer<typeof GeneratedGroupingSchema>;

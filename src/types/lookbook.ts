// ── Product data types ────────────────────────────────────────────────────────
// Adapted from MRL-SS27/lib/types.ts — generalised for multi-tenant use.

export interface Colorway {
  material: string;         // SKU / J-code — unique key
  colour: string;
  marketingColour: string;
  emea_key_story: boolean;
}

export interface Product {
  patternName: string;
  gender: "Men's" | "Women's" | "Unisex";
  activityType: string;
  division: string;
  sizing: string;
  protection: string;
  colorways: Colorway[];
  features?: string[];
  technology?: string[];
}

export interface Collection {
  id: string;
  name: string;
  products: Product[];
}

export interface Territory {
  id: string;
  name: string;
  collections: Collection[];
}

export interface ProductData {
  territories: Territory[];
}

export type AngleKey = 'main' | 'angle45' | 'side' | 'back' | 'outsole';

export interface ProductImages {
  main: string | null;
  angle45: string | null;
  side: string | null;
  back: string | null;
  outsole: string | null;
}

// ── Lookbook / section types ──────────────────────────────────────────────────

export type LookbookStatus = 'draft' | 'published' | 'archived';
export type SectionType =
  | 'hero'
  | 'product_grid'
  | 'editorial'
  | 'campaign'
  | 'banner'
  // ── Cinematic section types (Phase 5) ──
  | 'video_hero'         // Scroll-scrubbed video + word-by-word text reveal
  | 'horizontal_scroll'  // GSAP side-scroll panels with snap
  | 'sticky_chapters'    // Multi-chapter sticky scroll with parallax panels
  | 'parallax_editorial';// Dual-image parallax + velocity-blur headline

export interface LookbookSection {
  id: string;
  lookbook_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  type: SectionType;
  config: Record<string, unknown>;
  sort_order: number;
}

export interface LookbookConfig {
  template_id: string;
  layout?: string;
  section_order?: string[];
  hero?: {
    media_url?: string;
    media_type?: 'image' | 'video';
    headline?: string;
    subline?: string;
  };
  filter?: {
    enabled: boolean;
    filter_groups?: string[];
  };
}

export interface Lookbook {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  template_id: string;
  config: LookbookConfig;
  status: LookbookStatus;
  published_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LookbookProduct {
  id: string;
  lookbook_id: string;
  product_id: string;
  section: string;
  position: number;
  featured: boolean;
  tenant_id: string;
}

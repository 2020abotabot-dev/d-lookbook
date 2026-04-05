import type { TenantConfig } from "@/types/tenant";
import type { DbUser, DbProduct, DbLookbook, DbLookbookSection, DbLookbookProduct } from "@/types/database";

// ── Mock Tenant ───────────────────────────────────────────────────────────────

export const MOCK_TENANT: TenantConfig = {
  id: "mock-tenant-001",
  slug: "demo-brand",
  name: "Demo Brand",
  custom_domain: null,
  plan: "pro",
  branding: {
    logo_url: "",
    primary_color: "#111111",
    secondary_color: "#ffffff",
    accent_color: "#0070f3",
    font_heading: "Inter",
    font_body: "Inter",
    favicon_url: "",
  },
  settings: {
    company_url: "https://demobrand.com",
    contact_email: "hello@demobrand.com",
    default_currency: "EUR",
    locale: "en",
  },
};

// ── Mock User ─────────────────────────────────────────────────────────────────

export const MOCK_USER: DbUser = {
  id: "mock-user-001",
  tenant_id: "mock-tenant-001",
  email: "test@demobrand.com",
  full_name: "Test User",
  role: "owner",
  created_at: new Date().toISOString(),
};

export const MOCK_TEAM: DbUser[] = [
  MOCK_USER,
  {
    id: "mock-user-002",
    tenant_id: "mock-tenant-001",
    email: "editor@demobrand.com",
    full_name: "Jane Editor",
    role: "editor",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// ── Mock Products ─────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: DbProduct[] = [
  {
    id: "prod-001",
    tenant_id: "mock-tenant-001",
    name: "Trail Runner Pro",
    sku: "TRP-001-BLK",
    description: "**High-performance** trail running shoe with aggressive Vibram® grip outsole and FloatPro™ midsole cushioning.",
    price: 149.95,
    currency: "EUR",
    category: "Trail Running",
    subcategory: null,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
    specs: { weight: "280g", drop: "8mm", lug_depth: "4mm", midsole: "FloatPro™", outsole: "Vibram® TC5+" },
    tags: ["trail", "running", "grip", "vibram"],
    status: "active",
    sort_order: 1,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-002",
    tenant_id: "mock-tenant-001",
    name: "Hike GTX Mid",
    sku: "HGM-002-BRN",
    description: "Waterproof mid-cut hiking boot with **GORE-TEX** Extended Comfort lining for all-weather performance.",
    price: 189.95,
    currency: "EUR",
    category: "Light Hiking",
    subcategory: "GTX",
    images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80"],
    specs: { weight: "420g", waterproofing: "GORE-TEX", lacing: "Traditional", shaft: "Mid" },
    tags: ["hiking", "gtx", "waterproof", "mid"],
    status: "active",
    sort_order: 2,
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-003",
    tenant_id: "mock-tenant-001",
    name: "Recovery Slide",
    sku: "RCS-003-SND",
    description: "Post-activity recovery sandal with contoured EVA footbed and adjustable single strap.",
    price: 59.95,
    currency: "EUR",
    category: "Recovery",
    subcategory: null,
    images: ["https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80"],
    specs: { footbed: "Contoured EVA", strap: "Single adjustable", sole: "Rubber" },
    tags: ["recovery", "sandal", "casual"],
    status: "active",
    sort_order: 3,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-004",
    tenant_id: "mock-tenant-001",
    name: "Water Shoe Amphibian",
    sku: "WSA-004-BLU",
    description: "Versatile water shoe for river crossings and beach use. Multi-port drainage system.",
    price: 79.95,
    currency: "EUR",
    category: "Water",
    subcategory: null,
    images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80"],
    specs: { drainage: "Multi-port", sole: "Vibram® TC5+", upper: "Mesh" },
    tags: ["water", "amphibious", "vibram"],
    status: "active",
    sort_order: 4,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-005",
    tenant_id: "mock-tenant-001",
    name: "Casual Sneaker Low",
    sku: "CSL-005-WHT",
    description: "Clean everyday sneaker with premium leather upper and rubber cupsole.",
    price: 119.95,
    currency: "EUR",
    category: "Casual",
    subcategory: null,
    images: ["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80"],
    specs: { upper: "Premium leather", sole: "Rubber cupsole", lining: "Textile" },
    tags: ["casual", "lifestyle", "leather"],
    status: "draft",
    sort_order: 5,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ── Mock Lookbooks ────────────────────────────────────────────────────────────

export const MOCK_LOOKBOOKS: DbLookbook[] = [
  {
    id: "lb-001",
    tenant_id: "mock-tenant-001",
    title: "SS27 Collection",
    description: "Spring/Summer 2027 full collection overview.",
    template_id: "collection",
    config: {
      template_id: "collection",
      hero: { headline: "Explore SS27", subline: "Built for the outdoors", media_type: "image" },
      filter: { enabled: true },
    },
    status: "published",
    published_url: "https://demo-brand.dlookbook.com/lb-001",
    published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "lb-002",
    tenant_id: "mock-tenant-001",
    title: "AW27 Preview",
    description: "Autumn/Winter 2027 buyer preview.",
    template_id: "lifestyle",
    config: {
      template_id: "lifestyle",
      filter: { enabled: true },
    },
    status: "draft",
    published_url: null,
    published_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// ── Mock Sections ─────────────────────────────────────────────────────────────

export const MOCK_SECTIONS: DbLookbookSection[] = [
  {
    id: "sec-001",
    lookbook_id: "lb-001",
    tenant_id: "mock-tenant-001",
    title: "Campaign Hero",
    description: "SS27 hero visual",
    type: "hero",
    config: { headline: "Explore SS27", subline: "Built for the outdoors", overlay_opacity: 0.4 },
    sort_order: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "sec-002",
    lookbook_id: "lb-001",
    tenant_id: "mock-tenant-001",
    title: "Trail & Water",
    description: "Performance footwear",
    type: "product_grid",
    config: { layout: "3-col", filter_enabled: true },
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "sec-003",
    lookbook_id: "lb-001",
    tenant_id: "mock-tenant-001",
    title: "Lifestyle & Recovery",
    description: "Everyday and recovery styles",
    type: "product_grid",
    config: { layout: "4-col", filter_enabled: false },
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
];

// ── Mock Lookbook Products ────────────────────────────────────────────────────

export const MOCK_LOOKBOOK_PRODUCTS: DbLookbookProduct[] = [
  { id: "lbp-001", lookbook_id: "lb-001", product_id: "prod-001", tenant_id: "mock-tenant-001", section: "sec-002", position: 0, featured: true },
  { id: "lbp-002", lookbook_id: "lb-001", product_id: "prod-002", tenant_id: "mock-tenant-001", section: "sec-002", position: 1, featured: false },
  { id: "lbp-003", lookbook_id: "lb-001", product_id: "prod-004", tenant_id: "mock-tenant-001", section: "sec-002", position: 2, featured: false },
  { id: "lbp-004", lookbook_id: "lb-001", product_id: "prod-003", tenant_id: "mock-tenant-001", section: "sec-003", position: 0, featured: false },
  { id: "lbp-005", lookbook_id: "lb-001", product_id: "prod-005", tenant_id: "mock-tenant-001", section: "sec-003", position: 1, featured: false },
];

// ── Derived helpers ───────────────────────────────────────────────────────────

export const MOCK_CATEGORIES = [...new Set(MOCK_PRODUCTS.map(p => p.category))];

export const MOCK_STATS = {
  productCount:       MOCK_PRODUCTS.length,
  activeProductCount: MOCK_PRODUCTS.filter(p => p.status === "active").length,
  lookbookCount:      MOCK_LOOKBOOKS.length,
  publishedCount:     MOCK_LOOKBOOKS.filter(l => l.status === "published").length,
};

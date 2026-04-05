-- ============================================================
-- D-LookBook — Initial Schema
-- ============================================================
-- Run against a fresh Supabase project.
-- Enable the pgcrypto extension for gen_random_uuid().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Enums ──────────────────────────────────────────────────────────────────────

CREATE TYPE tenant_plan   AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE user_role     AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE lookbook_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE section_type  AS ENUM (
  'hero', 'product_grid', 'editorial', 'campaign', 'banner',
  'video_hero', 'horizontal_scroll', 'sticky_chapters', 'parallax_editorial'
);

-- ── tenants ────────────────────────────────────────────────────────────────────

CREATE TABLE tenants (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text NOT NULL,
  slug                   text NOT NULL UNIQUE,
  custom_domain          text,
  plan                   tenant_plan NOT NULL DEFAULT 'starter',
  stripe_customer_id     text,
  stripe_subscription_id text,
  branding               jsonb NOT NULL DEFAULT '{
    "logo_url":        "",
    "primary_color":   "#000000",
    "secondary_color": "#ffffff",
    "accent_color":    "#0070f3",
    "font_heading":    "sans-serif",
    "font_body":       "sans-serif",
    "favicon_url":     ""
  }'::jsonb,
  settings               jsonb NOT NULL DEFAULT '{
    "company_url":      "",
    "contact_email":    "",
    "default_currency": "EUR",
    "locale":           "en"
  }'::jsonb,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ── users ──────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'editor',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_tenant_idx ON users(tenant_id);

-- ── RLS helper function ────────────────────────────────────────────────────────
-- Returns the tenant_id for the currently authenticated user.

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── products ───────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  sku         text NOT NULL,
  description text NOT NULL DEFAULT '',
  price       decimal(10, 2) NOT NULL DEFAULT 0,
  currency    text NOT NULL DEFAULT 'EUR',
  category    text NOT NULL DEFAULT '',
  subcategory text,
  images      text[] NOT NULL DEFAULT '{}',
  specs       jsonb NOT NULL DEFAULT '{}',
  tags        text[] NOT NULL DEFAULT '{}',
  status      product_status NOT NULL DEFAULT 'draft',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);

CREATE INDEX products_tenant_idx    ON products(tenant_id);
CREATE INDEX products_category_idx  ON products(tenant_id, category);
CREATE INDEX products_status_idx    ON products(tenant_id, status);

-- ── lookbooks ──────────────────────────────────────────────────────────────────

CREATE TABLE lookbooks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  template_id   text NOT NULL DEFAULT 'default',
  config        jsonb NOT NULL DEFAULT '{}',
  status        lookbook_status NOT NULL DEFAULT 'draft',
  published_url text,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lookbooks_tenant_idx  ON lookbooks(tenant_id);
CREATE INDEX lookbooks_status_idx  ON lookbooks(tenant_id, status);

-- ── lookbook_products ──────────────────────────────────────────────────────────

CREATE TABLE lookbook_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lookbook_id uuid NOT NULL REFERENCES lookbooks(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  section     text NOT NULL DEFAULT 'default',
  position    integer NOT NULL DEFAULT 0,
  featured    boolean NOT NULL DEFAULT false,
  UNIQUE (lookbook_id, product_id)
);

CREATE INDEX lookbook_products_lookbook_idx ON lookbook_products(lookbook_id);
CREATE INDEX lookbook_products_tenant_idx   ON lookbook_products(tenant_id);

-- ── lookbook_sections ──────────────────────────────────────────────────────────

CREATE TABLE lookbook_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lookbook_id uuid NOT NULL REFERENCES lookbooks(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  type        section_type NOT NULL DEFAULT 'product_grid',
  config      jsonb NOT NULL DEFAULT '{}',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lookbook_sections_lookbook_idx ON lookbook_sections(lookbook_id);
CREATE INDEX lookbook_sections_tenant_idx   ON lookbook_sections(tenant_id);

-- ── lookbook_user_selections ───────────────────────────────────────────────────
-- Persists per-user visibility selections within a lookbook (from selection-context).

CREATE TABLE lookbook_user_selections (
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lookbook_id          uuid NOT NULL REFERENCES lookbooks(id) ON DELETE CASCADE,
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hidden_territories   text[] NOT NULL DEFAULT '{}',
  hidden_collections   text[] NOT NULL DEFAULT '{}',
  hidden_products      text[] NOT NULL DEFAULT '{}',
  hidden_colorways     text[] NOT NULL DEFAULT '{}',
  updated_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lookbook_id)
);

-- ── tenant_ai_usage ────────────────────────────────────────────────────────────

CREATE TABLE tenant_ai_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month       text NOT NULL,            -- e.g. '2027-03'
  call_count  integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, month)
);

CREATE INDEX ai_usage_tenant_idx ON tenant_ai_usage(tenant_id);

CREATE POLICY "ai_usage_tenant_isolation" ON tenant_ai_usage
  FOR ALL USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

ALTER TABLE tenant_ai_usage ENABLE ROW LEVEL SECURITY;

-- ── analytics_events ───────────────────────────────────────────────────────────

CREATE TABLE analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lookbook_id uuid NOT NULL REFERENCES lookbooks(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  session_id  text NOT NULL,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX analytics_tenant_idx  ON analytics_events(tenant_id);
CREATE INDEX analytics_lookbook_idx ON analytics_events(lookbook_id);
CREATE INDEX analytics_created_idx  ON analytics_events(created_at DESC);

-- ── updated_at trigger ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at   BEFORE UPDATE ON tenants   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER products_updated_at  BEFORE UPDATE ON products  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER lookbooks_updated_at BEFORE UPDATE ON lookbooks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE tenants                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbooks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_sections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_user_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events         ENABLE ROW LEVEL SECURITY;

-- tenants: users can only read their own tenant
CREATE POLICY "tenant_read_own" ON tenants
  FOR SELECT USING (id = get_current_tenant_id());

CREATE POLICY "tenant_update_own" ON tenants
  FOR UPDATE USING (id = get_current_tenant_id());

-- users: tenant-scoped access
CREATE POLICY "users_tenant_isolation" ON users
  FOR ALL USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- products
CREATE POLICY "products_tenant_isolation" ON products
  FOR ALL USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- lookbooks: full tenant isolation (read-access for published lookbooks added separately)
CREATE POLICY "lookbooks_tenant_isolation" ON lookbooks
  FOR ALL USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Allow anonymous reads of published lookbooks (for public URLs)
CREATE POLICY "lookbooks_public_read" ON lookbooks
  FOR SELECT TO anon
  USING (status = 'published');

-- lookbook_products
CREATE POLICY "lookbook_products_tenant_isolation" ON lookbook_products
  FOR ALL USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "lookbook_products_public_read" ON lookbook_products
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM lookbooks lb
      WHERE lb.id = lookbook_products.lookbook_id
        AND lb.status = 'published'
    )
  );

-- lookbook_sections
CREATE POLICY "lookbook_sections_tenant_isolation" ON lookbook_sections
  FOR ALL USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "lookbook_sections_public_read" ON lookbook_sections
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM lookbooks lb
      WHERE lb.id = lookbook_sections.lookbook_id
        AND lb.status = 'published'
    )
  );

-- lookbook_user_selections: each user owns their own rows
CREATE POLICY "selections_own_user" ON lookbook_user_selections
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

-- analytics_events: public INSERT (tracking), tenant SELECT
CREATE POLICY "analytics_public_insert" ON analytics_events
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "analytics_tenant_read" ON analytics_events
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- ============================================================
-- Storage bucket: brand-assets
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own tenant folder: {tenant_id}/...
CREATE POLICY "tenant_folder_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = get_current_tenant_id()::text
  );

-- Authenticated users can read their tenant's assets
CREATE POLICY "tenant_folder_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = get_current_tenant_id()::text
  );

-- Authenticated users can update/delete their own uploaded objects
CREATE POLICY "tenant_folder_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = get_current_tenant_id()::text
  );

CREATE POLICY "tenant_folder_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = get_current_tenant_id()::text
  );

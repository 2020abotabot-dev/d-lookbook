// Database row types matching the Supabase schema.
// Keep in sync with supabase/migrations/001_initial_schema.sql

import type { TenantPlan, UserRole } from './tenant';
import type { LookbookStatus, SectionType, LookbookConfig } from './lookbook';

export interface DbTenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  plan: TenantPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  branding: {
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_heading: string;
    font_body: string;
    favicon_url: string;
  };
  settings: {
    company_url: string;
    contact_email: string;
    default_currency: string;
    locale: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface DbProduct {
  id: string;
  tenant_id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subcategory: string | null;
  images: string[];
  specs: Record<string, unknown>;
  tags: string[];
  status: 'draft' | 'active' | 'archived';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbLookbook {
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

export interface DbLookbookProduct {
  id: string;
  lookbook_id: string;
  product_id: string;
  section: string;
  position: number;
  featured: boolean;
  tenant_id: string;
}

export interface DbLookbookSection {
  id: string;
  lookbook_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  type: SectionType;
  config: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export interface DbAnalyticsEvent {
  id: string;
  tenant_id: string;
  lookbook_id: string;
  event_type: string;
  product_id: string | null;
  session_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

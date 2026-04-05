export type TenantPlan = 'starter' | 'pro' | 'enterprise';

export interface TenantBranding {
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  favicon_url: string;
}

export interface TenantSettings {
  company_url: string;
  contact_email: string;
  default_currency: string;
  locale: string;
}

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  custom_domain: string | null;
  plan: TenantPlan;
  branding: TenantBranding;
  settings: TenantSettings;
}

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TenantUser {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

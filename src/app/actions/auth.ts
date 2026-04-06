"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TEST_MODE } from "@/lib/test-mode";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Generate a unique slug — appends a random suffix if taken */
async function generateUniqueSlug(base: string): Promise<string> {
  const service = createServiceClient();
  let slug = slugify(base);

  const { count } = await service
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);

  if (!count) return slug;

  // Append 4-char random suffix
  slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  return slug;
}

export async function signUp(formData: FormData): Promise<void> {
  if (TEST_MODE) redirect("/dashboard");

  const brandName = formData.get("brand_name") as string;
  const email     = formData.get("email") as string;
  const password  = formData.get("password") as string;

  if (!brandName || !email || !password) {
    redirect("/signup?error=missing_fields");
  }

  const supabase = await createClient();
  const service  = createServiceClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: brandName } },
  });

  if (authError || !authData.user) {
    redirect(`/signup?error=${encodeURIComponent(authError?.message ?? "signup_failed")}`);
  }

  const userId = authData.user!.id;

  // 2. Create tenant record (using service role to bypass RLS on insert)
  const slug = await generateUniqueSlug(brandName);

  const { data: tenant, error: tenantError } = await service
    .from("tenants")
    .insert({
      name: brandName,
      slug,
      branding: {
        logo_url:        "",
        primary_color:   "#000000",
        secondary_color: "#ffffff",
        accent_color:    "#0070f3",
        font_heading:    "sans-serif",
        font_body:       "sans-serif",
        favicon_url:     "",
      },
      settings: {
        company_url:      "",
        contact_email:    email,
        default_currency: "EUR",
        locale:           "en",
      },
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    await service.auth.admin.deleteUser(userId);
    redirect("/signup?error=workspace_creation_failed");
  }

  // 3. Create user record (owner)
  const { error: userError } = await service.from("users").insert({
    id:        userId,
    tenant_id: tenant!.id,
    email,
    full_name: brandName,
    role:      "owner",
  });

  if (userError) {
    await service.auth.admin.deleteUser(userId);
    await service.from("tenants").delete().eq("id", tenant!.id);
    redirect("/signup?error=account_link_failed");
  }

  // If Supabase requires email confirmation, authData.session will be null.
  // Redirect to a "check your email" state instead of dashboard.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/signup?check_email=1");
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<void> {
  if (TEST_MODE) redirect("/dashboard");

  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("email not confirmed")) {
      redirect("/login?error=email_not_confirmed");
    }
    redirect(`/login?error=${encodeURIComponent(error.message ?? "invalid_credentials")}`);
  }

  if (!data.session) {
    redirect("/login?error=no_session_returned");
  }

  // Auto-provision tenant + user record if missing (e.g. signed up in test mode)
  const service = createServiceClient();
  const { data: existing } = await service
    .from("users")
    .select("id")
    .eq("id", data.session.user.id)
    .single();

  if (!existing) {
    const fallbackName = data.session.user.user_metadata?.full_name
      ?? email.split("@")[0]
      ?? "My Brand";
    const slug = await generateUniqueSlug(fallbackName);
    const { data: tenant } = await service
      .from("tenants")
      .insert({
        name: fallbackName,
        slug,
        branding: {
          logo_url: "", primary_color: "#000000", secondary_color: "#ffffff",
          accent_color: "#0070f3", font_heading: "sans-serif",
          font_body: "sans-serif", favicon_url: "",
        },
        settings: {
          company_url: "", contact_email: email,
          default_currency: "EUR", locale: "en",
        },
      })
      .select("id")
      .single();

    if (tenant) {
      await service.from("users").insert({
        id:        data.session.user.id,
        tenant_id: tenant.id,
        email,
        full_name: fallbackName,
        role:      "owner",
      });
    }
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  if (!TEST_MODE) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

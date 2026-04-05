import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { TEST_MODE } from "@/lib/test-mode";
import { MOCK_TENANT, MOCK_USER, MOCK_STATS, MOCK_LOOKBOOKS } from "@/lib/mock/data";
import Link from "next/link";

export const metadata = { title: "Dashboard — DLookBook" };

export default async function DashboardPage() {
  // ── Test mode: use mock data ──────────────────────────────────────────────
  if (TEST_MODE) {
    return <DashboardView
      tenantName={MOCK_TENANT.name}
      tenantPlan={MOCK_TENANT.plan}
      userName={MOCK_USER.full_name}
      productCount={MOCK_STATS.productCount}
      activeProductCount={MOCK_STATS.activeProductCount}
      lookbookCount={MOCK_STATS.lookbookCount}
      publishedCount={MOCK_STATS.publishedCount}
      recentLookbooks={MOCK_LOOKBOOKS.slice(0, 3).map(l => ({
        id: l.id,
        title: l.title,
        status: l.status,
      }))}
    />;
  }

  // ── Production: fetch from Supabase ───────────────────────────────────────
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tenantUser } = await service
    .from("users")
    .select("tenant_id, full_name, role, tenants(name, slug, plan)")
    .eq("id", user.id)
    .single();

  const tenantRaw = tenantUser?.tenants;
  const tenant = (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw) as
    | { name: string; slug: string; plan: string }
    | null
    | undefined;

  const { count: lookbookCount } = await service
    .from("lookbooks")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantUser?.tenant_id);

  const { count: productCount } = await service
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantUser?.tenant_id);

  const { count: activeProductCount } = await service
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantUser?.tenant_id)
    .eq("status", "active");

  const { count: publishedCount } = await service
    .from("lookbooks")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantUser?.tenant_id)
    .eq("status", "published");

  const { data: recentLookbooks } = await service
    .from("lookbooks")
    .select("id, title, status")
    .eq("tenant_id", tenantUser?.tenant_id)
    .order("updated_at", { ascending: false })
    .limit(3);

  return <DashboardView
    tenantName={tenant?.name ?? "Your workspace"}
    tenantPlan={tenant?.plan ?? "starter"}
    userName={tenantUser?.full_name ?? user.email ?? ""}
    productCount={productCount ?? 0}
    activeProductCount={activeProductCount ?? 0}
    lookbookCount={lookbookCount ?? 0}
    publishedCount={publishedCount ?? 0}
    recentLookbooks={(recentLookbooks ?? []).map(l => ({
      id: l.id,
      title: l.title,
      status: l.status,
    }))}
  />;
}

// ── Shared view component ─────────────────────────────────────────────────────

function DashboardView({
  tenantName,
  tenantPlan,
  userName,
  productCount,
  activeProductCount,
  lookbookCount,
  publishedCount,
  recentLookbooks,
}: {
  tenantName: string;
  tenantPlan: string;
  userName: string;
  productCount: number;
  activeProductCount: number;
  lookbookCount: number;
  publishedCount: number;
  recentLookbooks: { id: string; title: string; status: string }[];
}) {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">Welcome, {userName}</h1>
        <p className="dashboard__sub">
          {tenantName} ·{" "}
          <span className="dashboard__plan">{tenantPlan}</span>
        </p>
      </header>

      <div className="dashboard__stats">
        <div className="stat-card">
          <p className="stat-card__value">{lookbookCount}</p>
          <p className="stat-card__label">Lookbooks</p>
          <p className="stat-card__sub">{publishedCount} published</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__value">{productCount}</p>
          <p className="stat-card__label">Products</p>
          <p className="stat-card__sub">{activeProductCount} active</p>
        </div>
      </div>

      <div className="dashboard__actions">
        <Link href="/builder" className="btn btn--primary">+ New Lookbook</Link>
        <Link href="/products" className="btn btn--ghost">Manage Products</Link>
      </div>

      {recentLookbooks.length > 0 && (
        <section className="dashboard__recent">
          <h2 className="dashboard__section-title">Recent Lookbooks</h2>
          <div className="lookbook-list">
            {recentLookbooks.map(lb => (
              <div key={lb.id} className="lookbook-row">
                <span className="lookbook-row__title">{lb.title}</span>
                <span className={`lookbook-row__badge lookbook-row__badge--${lb.status}`}>
                  {lb.status}
                </span>
                <Link href={`/builder/${lb.id}/edit`} className="lookbook-row__edit">
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

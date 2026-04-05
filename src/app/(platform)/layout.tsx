import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TEST_MODE } from "@/lib/test-mode";
import { MOCK_USER, MOCK_TENANT } from "@/lib/mock/data";
import TestModeBanner from "@/components/ui/TestModeBanner";
import { signOut } from "@/app/actions/auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let displayName = "User";
  let tenantName  = "Workspace";

  if (TEST_MODE) {
    displayName = MOCK_USER.full_name;
    tenantName  = MOCK_TENANT.name;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    displayName = user.user_metadata?.full_name ?? user.email ?? "User";
  }

  return (
    <div className="platform-layout">
      <aside className="platform-sidebar">
        <div className="platform-sidebar__logo">DLookBook</div>

        <nav className="platform-nav">
          <a href="/dashboard" className="platform-nav__item">Dashboard</a>
          <a href="/products"  className="platform-nav__item">Products</a>
          <a href="/builder"   className="platform-nav__item">Lookbooks</a>
          <a href="/settings"  className="platform-nav__item">Settings</a>
        </nav>

        <div className="platform-sidebar__footer">
          <div className="platform-sidebar__user">
            <p className="platform-sidebar__user-name">{displayName}</p>
            <p className="platform-sidebar__user-workspace">{tenantName}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="platform-sidebar__signout">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="platform-main">{children}</main>

      {TEST_MODE && <TestModeBanner />}
    </div>
  );
}

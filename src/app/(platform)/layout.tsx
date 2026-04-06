import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Quick session check — if no session at all, redirect to login immediately.
  // Individual pages call getCurrentTenant() for full user + tenant data.
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const displayName =
    session.user.user_metadata?.full_name ??
    session.user.email ??
    "User";

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
          </div>
          <form action={signOut}>
            <button type="submit" className="platform-sidebar__signout">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="platform-main">{children}</main>
    </div>
  );
}

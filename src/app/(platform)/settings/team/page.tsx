import { getCurrentTenant } from "@/lib/server/session";
import { createServiceClient } from "@/lib/supabase/server";
import TeamClient from "@/components/admin/settings/TeamClient";
import Breadcrumb from "@/components/ui/Breadcrumb";
import type { DbUser } from "@/types/database";

export const metadata = { title: "Team — Settings — DLookBook" };

export default async function TeamPage() {
  const { tenant, tenantId } = await getCurrentTenant();
  const service = createServiceClient();

  const { data } = await service
    .from("users")
    .select("id, email, full_name, role")
    .eq("tenant_id", tenantId)
    .order("role");

  const members = (data ?? []) as Pick<DbUser, "id" | "email" | "full_name" | "role">[];

  return (
    <div className="platform-page">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Team" }]} />
          <h1 className="platform-page__title">Team</h1>
          <p className="platform-page__sub">Manage who has access to your workspace</p>
        </div>
      </div>
      <TeamClient tenantId={tenant.id} initialMembers={members as DbUser[]} />
    </div>
  );
}

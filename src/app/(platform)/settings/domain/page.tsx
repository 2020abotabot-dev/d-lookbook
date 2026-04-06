import { getCurrentTenant } from "@/lib/server/session";
import DomainClient from "@/components/admin/settings/DomainClient";
import Breadcrumb from "@/components/ui/Breadcrumb";

export const metadata = { title: "Domain — Settings — DLookBook" };

export default async function DomainPage() {
  const { tenant } = await getCurrentTenant();

  return (
    <div className="platform-page">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Domain" }]} />
          <h1 className="platform-page__title">Domain</h1>
          <p className="platform-page__sub">Configure your lookbook URL</p>
        </div>
      </div>
      <DomainClient
        tenantId={tenant.id}
        slug={tenant.slug}
        initialDomain={tenant.custom_domain ?? ""}
      />
    </div>
  );
}

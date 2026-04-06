import { getCurrentTenant } from "@/lib/server/session";
import Breadcrumb from "@/components/ui/Breadcrumb";
import BrandingForm from "@/components/admin/branding/BrandingForm";

export const metadata = { title: "Branding — Settings — DLookBook" };

export default async function BrandingPage() {
  const { tenant } = await getCurrentTenant();

  return (
    <div className="platform-page platform-page--wide">
      <div className="platform-page__header">
        <div>
          <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Branding" }]} />
          <h1 className="platform-page__title">Branding</h1>
          <p className="platform-page__sub">Customize the visual identity of your lookbooks</p>
        </div>
      </div>

      <BrandingForm
        tenantId={tenant.id}
        tenantName={tenant.name}
        initial={tenant.branding}
      />
    </div>
  );
}

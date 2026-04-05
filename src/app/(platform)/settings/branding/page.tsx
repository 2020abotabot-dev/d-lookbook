import { TEST_MODE } from "@/lib/test-mode";
import { MOCK_TENANT } from "@/lib/mock/data";
import Breadcrumb from "@/components/ui/Breadcrumb";
import BrandingForm from "@/components/admin/branding/BrandingForm";

export const metadata = { title: "Branding — Settings — DLookBook" };

export default async function BrandingPage() {
  // In production: load tenant from Supabase via service client
  const tenant = MOCK_TENANT; // TODO: replace with real DB fetch when !TEST_MODE

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

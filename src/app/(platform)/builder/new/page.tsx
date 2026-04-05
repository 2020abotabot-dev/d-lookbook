import { getCurrentTenant } from "@/lib/server/session";
import NewLookbookClient from "@/components/admin/lookbook/NewLookbookClient";

export const metadata = { title: "New Lookbook — DLookBook" };

export default async function NewLookbookPage() {
  const { tenantId } = await getCurrentTenant();
  return <NewLookbookClient tenantId={tenantId} />;
}

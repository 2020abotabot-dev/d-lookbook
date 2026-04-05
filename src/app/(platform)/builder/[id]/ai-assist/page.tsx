import { getCurrentTenant } from "@/lib/server/session";
import AIAssistClient from "@/components/admin/ai/AIAssistClient";

export const metadata = { title: "AI Layout — DLookBook" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AIAssistPage({ params }: Props) {
  const { id } = await params;
  const { tenantId } = await getCurrentTenant();
  return <AIAssistClient id={id} tenantId={tenantId} />;
}

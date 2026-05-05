import AppShell from "@/frontend/components/layout/AppShell";
import MemberDetailView from "@/frontend/views/members/MemberDetailView";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <MemberDetailView id={id} />
    </AppShell>
  );
}

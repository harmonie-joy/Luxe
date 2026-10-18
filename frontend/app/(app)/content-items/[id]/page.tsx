import { ContentItemDashboard } from "@/features/creator/components/content-item-dashboard";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContentItemDashboard key={id} id={id} />;
}

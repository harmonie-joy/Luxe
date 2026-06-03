import { notFound } from "next/navigation";
import { getSampleAsset } from "@/features/brand-voice/data/get-sample-asset";
import { SampleAssetPage } from "@/features/brand-voice/components/sample-asset-page";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SampleDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getSampleAsset(id);

  if (!data) notFound();

  return <SampleAssetPage data={data} />;
}

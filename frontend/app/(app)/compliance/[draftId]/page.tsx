import { notFound } from "next/navigation";

import { ComplianceReviewShell } from "@/features/compliance/components/compliance-review-shell";
import { getComplianceReviewPage } from "@/features/compliance/data/get-compliance-review-page";

interface Props {
  params: Promise<{ draftId: string }>;
}

export default async function ComplianceDraftPage({ params }: Props) {
  const { draftId } = await params;
  const data = await getComplianceReviewPage(draftId);

  if (!data) notFound();

  return <ComplianceReviewShell data={data} />;
}

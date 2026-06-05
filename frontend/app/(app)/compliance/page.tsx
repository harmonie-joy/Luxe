import { notFound, redirect } from "next/navigation";

import { getDefaultComplianceDraftId } from "@/features/compliance/data/get-compliance-review-page";
import { complianceReviewRoute } from "@/lib/routes";

export default async function CompliancePage() {
  const draftId = await getDefaultComplianceDraftId();

  if (!draftId) notFound();

  redirect(complianceReviewRoute(draftId));
}

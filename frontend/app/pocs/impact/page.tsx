import { mockPocImpact } from "@/data/mock-poc-impact";
import { ImpactLearn } from "@/features/impact/components/impact-learn";

export default function ImpactPage() {
  return <ImpactLearn posts={mockPocImpact.posts} />;
}
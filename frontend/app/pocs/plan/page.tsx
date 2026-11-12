import { mockPocPlan } from "@/data/mock-poc-plan";
import { PlanCapture } from "@/features/plan/components/plan-capture";

export default function PlanPage() {
  return <PlanCapture copy={mockPocPlan} />;
}
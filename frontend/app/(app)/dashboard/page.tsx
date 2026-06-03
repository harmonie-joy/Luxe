import { mockDashboard } from "@/data/mock-dashboard";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

export default function DashboardPage() {
  return <DashboardOverview dashboard={mockDashboard} />;
}

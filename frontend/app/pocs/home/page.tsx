import { PocHome } from "@/features/poc-home/components/poc-home";
import { mockPocHome } from "@/data/mock-poc-home";

export default function HomePage() {
  return <PocHome examples={mockPocHome} />;
}
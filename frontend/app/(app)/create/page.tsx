import { CreateBriefShell } from "@/features/create/components/create-brief-shell";
import { mockCreateBriefPage } from "@/data/mock-create-brief";

export default function CreateBriefPage() {
  return <CreateBriefShell data={mockCreateBriefPage} />;
}

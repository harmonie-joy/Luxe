import { DraftStudioShell } from "@/features/drafts/components/draft-studio-shell";
import { getDraftStudioPage } from "@/features/drafts/data/get-draft-studio-page";

export default async function DraftsPage() {
  const data = await getDraftStudioPage();

  return <DraftStudioShell data={data} />;
}

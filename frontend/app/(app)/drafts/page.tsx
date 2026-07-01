import { DraftStudioShell } from "@/features/drafts/components/draft-studio-shell";
import { getDraftStudioPage } from "@/features/drafts/data/get-draft-studio-page";

interface DraftsPageProps {
  searchParams?: Promise<{
    brief?: string | string[];
  }>;
}

export default async function DraftsPage({ searchParams }: DraftsPageProps) {
  const data = await getDraftStudioPage();
  const params = await searchParams;
  const briefParam = params?.brief;
  const initialBriefId = Array.isArray(briefParam) ? briefParam[0] : briefParam;

  return <DraftStudioShell data={data} initialBriefId={initialBriefId} />;
}

import { CreateBriefShell } from "@/features/create/components/create-brief-shell";
import { getCreateBriefPage } from "@/features/create/data/get-create-brief-page";

export default async function CreateBriefPage() {
  const data = await getCreateBriefPage();

  return <CreateBriefShell data={data} />;
}

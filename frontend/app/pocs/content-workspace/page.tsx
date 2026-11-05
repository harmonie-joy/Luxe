import { ContentWorkspace } from "@/app/pocs/components/content-workspace";
import { mockContentWorkspace } from "@/lib/mock-data/pocs-data";

export default function ContentWorkspacePage() {
  return <ContentWorkspace data={mockContentWorkspace} />;
}
import { TornadoWorkspace } from "@/app/pocs/components/tornado-workspace";
import { mockTornadoWorkspace } from "@/lib/mock-data/pocs-data";

export default function TornadoWorkspacePage() {
  return <TornadoWorkspace data={mockTornadoWorkspace} />;
}
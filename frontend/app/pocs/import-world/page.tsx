import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/routes";

export default function ImportWorldPreviewPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="luxe-eyebrow">STAGE 2</p>
        <h1 className="stage-flow-title">Import My World</h1>
        <p className="stage-flow-caption">This prototype stops at the Stage 2 entry point.</p>
      </header>
      <Card aria-labelledby="import-preview-title" padding="md">
        <Badge variant="pending">Not available in this prototype</Badge>
        <h2 className="mt-4" id="import-preview-title">Your sources are not connected</h2>
        <p className="luxe-muted mt-2">No accounts, files, or creator data are imported or stored here.</p>
        <Link className="luxe-ui-button luxe-ui-button--outline luxe-ui-button--md mt-6" href={APP_ROUTES.pocsBrandAssetKit}>
          Back to Brand Asset Kit
        </Link>
      </Card>
    </div>
  );
}
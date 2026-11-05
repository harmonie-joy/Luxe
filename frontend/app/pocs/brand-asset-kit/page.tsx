import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StageFlowFooter } from "@/app/pocs/components/stage-flow-footer";
import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { APP_ROUTES } from "@/lib/routes";

const assetCategories = ["Logos", "Fonts", "Media", "Templates", "Documents"];

export default function BrandAssetKitPage() {
  return (
    <div className="space-y-6">
      <StageFlowNavigation currentStep="brand-asset-kit" />
      <header className="space-y-3">
        <p className="luxe-eyebrow">STAGE 1 / STEP 5</p>
        <h1 className="stage-flow-title">Brand Asset Kit</h1>
        <p className="stage-flow-caption">A concept preview for keeping approved brand materials close at hand.</p>
      </header>

      <Card aria-labelledby="asset-kit-status" padding="lg">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="asset-kit-status">Your shared materials</h2>
          <Badge variant="pending">Concept preview</Badge>
        </div>
        <p className="luxe-muted">
          This preview is not connected to storage. No files are uploaded, saved, or available in this sample workspace.
        </p>
        <ul aria-label="Planned asset categories" className="mt-6 flex flex-wrap gap-2">
          {assetCategories.map((category) => (
            <li key={category}><Badge variant="neutral">{category}</Badge></li>
          ))}
        </ul>
      </Card>

      <p className="luxe-muted">
        Looking for visual references? <Link className="underline underline-offset-4" href={APP_ROUTES.pocsAestheticBoard}>Open the Aesthetic Board</Link>.
      </p>
      <StageFlowFooter
        backHref={APP_ROUTES.pocsBrandKit}
        completeStep="brand-asset-kit"
        nextHref={APP_ROUTES.pocsImportWorld}
        nextLabel="Complete Foundation & Proceed to Stage 2 (Import World)"
      />
    </div>
  );
}
"use client";

import { BrandGuidePrototype } from "@/features/brand-guide/components/brand-guide-prototype";
import { StageFlowFooter } from "@/app/pocs/components/stage-flow-footer";
import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { mockBrandGuide } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";

export default function BrandGuidePage() {
  return (
    <div className="space-y-6">
      <StageFlowNavigation currentStep="brand-kit" />
      <BrandGuidePrototype guide={mockBrandGuide} />
      <StageFlowFooter
        backHref={APP_ROUTES.pocsCreatorDNA}
        completeStep="brand-kit"
        nextHref={APP_ROUTES.pocsBrandAssetKit}
        nextLabel="Explore Asset Kit"
      />
    </div>
  );
}
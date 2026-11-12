"use client";

import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import { BrandGuidePrototype } from "@/features/brand-guide/components/brand-guide-prototype";
import { mockBrandGuide } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";
import { useStageContext } from "@/lib/state/stage-context";

export default function BrandKitPage() {
  const { profile } = useStageContext();
  return (
    <div className="stage-one-page space-y-6">
      <StageFlowNavigation currentStep="brand-kit" />
      {profile.answers.length > 0 && <p className="stage-flow-caption">Your voice: {profile.tone}. Communication style: {profile.communicationStyle}.</p>}
      <BrandGuidePrototype guide={mockBrandGuide} />
      <StageFlowFooter
        prevRoute={APP_ROUTES.pocsCreatorDNA}
        currentStep={4}
        totalSteps={5}
        completeStep="brand-kit"
        nextRoute={APP_ROUTES.pocsStageOneBrandAssetKit}
      />
    </div>
  );
}
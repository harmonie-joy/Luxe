import { mockOnboardingSetup } from "@/data/mock-onboarding";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export default function OnboardingPage() {
  return <OnboardingWizard config={mockOnboardingSetup} />;
}

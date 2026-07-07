import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import { BrandVoiceOverviewShell } from "@/features/brand-voice/components/brand-voice-shell";

export default function BrandVoicePage() {
  return <BrandVoiceOverviewShell initialData={mockBrandVoiceSetup} />;
}

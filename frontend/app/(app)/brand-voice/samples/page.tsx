import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import { BrandVoiceSamplesShell } from "@/features/brand-voice/components/brand-voice-shell";

export default function BrandVoiceSamplesPage() {
  return <BrandVoiceSamplesShell initialData={mockBrandVoiceSetup} />;
}

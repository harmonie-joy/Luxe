import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import { BrandVoiceShell } from "@/features/brand-voice/components/brand-voice-shell";

export default function BrandVoicePage() {
  return <BrandVoiceShell initialData={mockBrandVoiceSetup} />;
}

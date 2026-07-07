import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import { BrandVoiceProfileShell } from "@/features/brand-voice/components/brand-voice-shell";

export default function BrandVoiceProfilePage() {
  return <BrandVoiceProfileShell initialData={mockBrandVoiceSetup} />;
}

import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import { BrandVoiceAnalysisShell } from "@/features/brand-voice/components/brand-voice-shell";

export default function BrandVoiceAnalysisPage() {
  return <BrandVoiceAnalysisShell initialData={mockBrandVoiceSetup} />;
}

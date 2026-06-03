import { getBrandVoiceSetup } from "@/features/brand-voice/data/get-brand-voice-setup";
import { BrandProfileForm } from "@/features/brand-voice/components/brand-profile-form";
import { BrandProfilePreview } from "@/features/brand-voice/components/brand-profile-preview";
import { SampleContentUploader } from "@/features/brand-voice/components/sample-content-uploader";

export default async function BrandVoicePage() {
  const { pageHeader, profile, sampleContent, toneOptions } =
    await getBrandVoiceSetup();

  return (
    <div className="flex min-h-full flex-col gap-8">
      <header className="shrink-0">
        <p className="luxe-eyebrow">{pageHeader.eyebrow}</p>
        <h1 className="luxe-page-title mt-3 max-w-4xl">
          {pageHeader.title}
        </h1>
        <p className="luxe-page-description mt-4 max-w-2xl">
          {pageHeader.description}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <BrandProfileForm profile={profile} toneOptions={toneOptions} />
          <SampleContentUploader sampleContent={sampleContent} />
        </div>

        <BrandProfilePreview
          profile={profile}
          samples={sampleContent.samples}
          toneOptions={toneOptions}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import type { BrandVoiceSetupData } from "@/data/mock-brand-profiles";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { BrandProfileForm } from "@/features/brand-voice/components/brand-profile-form";
import { BrandProfilePreview } from "@/features/brand-voice/components/brand-profile-preview";
import { BrandVoiceAiPanel } from "@/features/brand-voice/components/brand-voice-ai-panel";
import { SampleContentUploader } from "@/features/brand-voice/components/sample-content-uploader";
import { getBrandVoiceSetup } from "@/features/brand-voice/data/get-brand-voice-setup";
import { isBrandVoiceMockMode } from "@/lib/brand-voice-mode";
import type { BrandAsset, BrandProfile } from "@/types/brand-profile";

interface BrandVoiceShellProps {
  initialData: BrandVoiceSetupData;
}

export function BrandVoiceShell({ initialData }: BrandVoiceShellProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(
    !isBrandVoiceMockMode() && initialData.source === "mock",
  );

  useEffect(() => {
    if (isBrandVoiceMockMode()) return;

    let isActive = true;

    async function loadLiveData() {
      try {
        const nextData = await getBrandVoiceSetup();
        if (isActive) setData(nextData);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadLiveData();

    return () => {
      isActive = false;
    };
  }, []);

  function handleProfileSaved(profile: BrandProfile) {
    setData((current) => ({
      ...current,
      profile,
      toneOptions: current.toneOptions.map((tone) => ({
        ...tone,
        selected: profile.tone.includes(tone.value),
      })),
    }));
  }

  function handleAssetSaved(asset: BrandAsset) {
    setData((current) => ({
      ...current,
      sampleContent: {
        ...current.sampleContent,
        samples: [asset, ...current.sampleContent.samples],
      },
    }));
  }

  const { loadError, pageHeader, profile, sampleContent, source, toneOptions } = data;
  const sourceLabel = isLoading
    ? "Loading live data"
    : source === "api"
      ? "Live"
      : loadError
        ? "Error - demo data"
        : "Demo";
  const sourceTone = isLoading
    ? "info"
    : source === "api"
      ? "success"
      : loadError
        ? "warning"
        : "neutral";

  return (
    <div className="flex min-h-full flex-col gap-8">
      <header className="shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="luxe-eyebrow">{pageHeader.eyebrow}</p>
            <h1 className="luxe-page-title mt-3 max-w-4xl">
              {pageHeader.title}
            </h1>
            <p className="luxe-page-description mt-4 max-w-2xl">
              {pageHeader.description}
            </p>
          </div>
          <StatusIndicator
            label={sourceLabel}
            tone={sourceTone}
          />
        </div>
        {loadError ? (
          <p className="luxe-preview-stat mt-4 max-w-2xl p-4 text-sm font-medium">
            Live Brand Voice data could not load. Showing demo data instead:{" "}
            {loadError}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <BrandProfileForm
            onProfileSaved={handleProfileSaved}
            profile={profile}
            source={source}
            toneOptions={toneOptions}
          />
          <BrandVoiceAiPanel
            onProfileSaved={handleProfileSaved}
            profile={profile}
            samples={sampleContent.samples}
            source={source}
          />
          <SampleContentUploader
            onAssetSaved={handleAssetSaved}
            profile={profile}
            sampleContent={sampleContent}
            source={source}
          />
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

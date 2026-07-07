"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { BrandVoiceSetupData } from "@/data/mock-brand-profiles";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { SurfaceCard } from "@/components/ui/surface-card";
import { BrandProfileForm } from "@/features/brand-voice/components/brand-profile-form";
import { BrandProfilePreview } from "@/features/brand-voice/components/brand-profile-preview";
import { BrandVoiceAiPanel } from "@/features/brand-voice/components/brand-voice-ai-panel";
import { SampleContentUploader } from "@/features/brand-voice/components/sample-content-uploader";
import { getBrandVoiceSetup } from "@/features/brand-voice/data/get-brand-voice-setup";
import { isBrandVoiceMockMode } from "@/lib/brand-voice-mode";
import { APP_ROUTES } from "@/lib/routes";
import type { BrandAsset, BrandProfile } from "@/types/brand-profile";

type BrandVoiceView = "overview" | "profile" | "analysis" | "samples";

interface BrandVoiceShellProps {
  initialData: BrandVoiceSetupData;
}

function OverviewCards({ data }: { data: BrandVoiceSetupData }) {
  const cards = [
    {
      href: APP_ROUTES.brandVoiceProfile,
      title: "Profile",
      description: "Tone, audience, and language guardrails.",
      meta: data.profile.name,
    },
    {
      href: APP_ROUTES.brandVoiceAnalysis,
      title: "Analysis",
      description: "AI analysis and brand voice extraction.",
      meta: `${data.profile.tone.length} tones selected`,
    },
    {
      href: APP_ROUTES.brandVoiceSamples,
      title: "Samples",
      description: "Reference content that anchors the voice.",
      meta: `${data.sampleContent.samples.length} samples`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {cards.map((card) => (
        <Link
          className="luxe-focus-ring block rounded-sm"
          href={card.href}
          key={card.href}
        >
          <SurfaceCard className="h-full">
            <p className="luxe-eyebrow">{card.title}</p>
            <p className="mt-3 text-sm leading-6 text-luxe-text-secondary">
              {card.description}
            </p>
            <p className="luxe-item-meta mt-4 text-sm">{card.meta}</p>
          </SurfaceCard>
        </Link>
      ))}
    </div>
  );
}

function BrandVoiceShell({
  initialData,
  view,
}: BrandVoiceShellProps & { view: BrandVoiceView }) {
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

      {view === "overview" ? (
        <OverviewCards data={data} />
      ) : view === "samples" ? (
        <SampleContentUploader
          onAssetSaved={handleAssetSaved}
          profile={profile}
          sampleContent={sampleContent}
          source={source}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {view === "profile" ? (
            <BrandProfileForm
              onProfileSaved={handleProfileSaved}
              profile={profile}
              source={source}
              toneOptions={toneOptions}
            />
          ) : (
            <BrandVoiceAiPanel
              onProfileSaved={handleProfileSaved}
              profile={profile}
              samples={sampleContent.samples}
              source={source}
            />
          )}

          <BrandProfilePreview
            profile={profile}
            samples={sampleContent.samples}
            toneOptions={toneOptions}
          />
        </div>
      )}
    </div>
  );
}

export function BrandVoiceOverviewShell(props: BrandVoiceShellProps) {
  return <BrandVoiceShell {...props} view="overview" />;
}

export function BrandVoiceProfileShell(props: BrandVoiceShellProps) {
  return <BrandVoiceShell {...props} view="profile" />;
}

export function BrandVoiceAnalysisShell(props: BrandVoiceShellProps) {
  return <BrandVoiceShell {...props} view="analysis" />;
}

export function BrandVoiceSamplesShell(props: BrandVoiceShellProps) {
  return <BrandVoiceShell {...props} view="samples" />;
}

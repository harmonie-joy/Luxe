"use client";

import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import type { SampleAssetPageData } from "@/data/mock-sample-assets";
import { getSampleAsset } from "@/features/brand-voice/data/get-sample-asset";
import { SampleAssetPage } from "@/features/brand-voice/components/sample-asset-page";

interface Props {
  params: Promise<{ id: string }>;
}

// Client component: live API auth rides on browser session cookies (same
// pattern as BrandVoiceShell), which a server-side fetch cannot send.
export default function SampleDetailPage({ params }: Props) {
  const { id } = use(params);
  const [data, setData] = useState<SampleAssetPageData | null>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    let isActive = true;
    getSampleAsset(id).then(
      (result) => {
        if (isActive) setData(result);
      },
      (err: unknown) => {
        if (isActive) setError(err);
      },
    );
    return () => {
      isActive = false;
    };
  }, [id]);

  // Re-throw async load failures during render so Next's error boundary
  // handles them instead of leaving a silent blank page.
  if (error) throw error;
  if (data === null) notFound();
  if (data === undefined) return null;

  return <SampleAssetPage data={data} />;
}

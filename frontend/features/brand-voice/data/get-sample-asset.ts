/**
 * Sample asset data source.
 *
 * Single entry point for the /brand-voice/samples/[id] page. Mode comes from
 * isBrandVoiceMockMode (live by default). In live mode the asset and its
 * BrandProfile are fetched; missing or unauthorized assets resolve to null so
 * the page can render not-found. Other failures (network, 5xx) are thrown to
 * the caller.
 */

import {
  getMockSampleAsset,
  type SampleAssetPageData,
} from "@/data/mock-sample-assets";
import { getBrandAsset, getBrandProfile } from "@/lib/api/brand-voice";
import { ApiError } from "@/lib/api/http-client";
import { isBrandVoiceMockMode } from "@/lib/brand-voice-mode";

export async function getSampleAsset(
  id: string,
): Promise<SampleAssetPageData | null> {
  if (isBrandVoiceMockMode()) {
    return getMockSampleAsset(id);
  }

  try {
    const asset = await getBrandAsset(id);
    const profile = await getBrandProfile(asset.brandProfileId);
    return { asset, brandProfileName: profile.name };
  } catch (err) {
    // Workspace-scoped querysets 404 for foreign or missing assets;
    // unauthenticated sessions get 401/403. All mean "no such page".
    if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
      return null;
    }
    throw err;
  }
}

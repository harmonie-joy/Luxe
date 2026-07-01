/**
 * Sample asset data source.
 *
 * Single entry point for the /brand-voice/samples/[id] page.
 * Falls back to mock data in MVP. Swap the implementation to a fetch
 * call without touching any consuming component.
 */

import {
  getMockSampleAsset,
  type SampleAssetPageData,
} from "@/data/mock-sample-assets";

export async function getSampleAsset(
  id: string,
): Promise<SampleAssetPageData | null> {
  return getMockSampleAsset(id);
}

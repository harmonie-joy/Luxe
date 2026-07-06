import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockSampleAsset } from "@/data/mock-sample-assets";
import { getSampleAsset } from "@/features/brand-voice/data/get-sample-asset";
import { getBrandAsset, getBrandProfile } from "@/lib/api/brand-voice";
import { ApiError } from "@/lib/api/http-client";
import type { BrandAsset, BrandProfile } from "@/types/brand-profile";

vi.mock("@/lib/api/brand-voice");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const liveAsset: BrandAsset = {
  ...getMockSampleAsset("editorial-launch-note")!.asset,
  id: "0b7f5b1e-live-asset",
  brandProfileId: "3f2a9c04-live-profile",
  title: "Live editorial note",
};

const liveProfile = {
  id: "3f2a9c04-live-profile",
  name: "Live Signature Voice",
} as BrandProfile;

describe("getSampleAsset", () => {
  it("returns mock data in intentional mock mode without touching the API", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_BRAND_VOICE", "true");
    const data = await getSampleAsset("editorial-launch-note");

    expect(data?.asset.id).toBe("editorial-launch-note");
    expect(data?.brandProfileName).toBe("THE LUXE Signature Voice");
    expect(getBrandAsset).not.toHaveBeenCalled();
  });

  it("loads the live asset and its profile name in API mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_BRAND_VOICE", "false");
    vi.mocked(getBrandAsset).mockResolvedValue(liveAsset);
    vi.mocked(getBrandProfile).mockResolvedValue(liveProfile);

    const data = await getSampleAsset("0b7f5b1e-live-asset");

    expect(getBrandAsset).toHaveBeenCalledWith("0b7f5b1e-live-asset");
    expect(getBrandProfile).toHaveBeenCalledWith("3f2a9c04-live-profile");
    expect(data).toEqual({
      asset: liveAsset,
      brandProfileName: "Live Signature Voice",
    });
  });

  it("returns null when the API responds 404", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_BRAND_VOICE", "false");
    vi.mocked(getBrandAsset).mockRejectedValue(
      new ApiError(404, "Not Found", "No BrandAsset matches the given query."),
    );

    await expect(getSampleAsset("missing-id")).resolves.toBeNull();
  });

  it("rethrows non-auth API failures instead of masking them as 404", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_BRAND_VOICE", "false");
    vi.mocked(getBrandAsset).mockRejectedValue(
      new ApiError(500, "Server Error", "boom"),
    );

    await expect(getSampleAsset("any-id")).rejects.toThrow("boom");
  });
});

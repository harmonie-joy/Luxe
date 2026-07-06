/**
 * Single source of truth for the Brand Voice data mode.
 *
 * Live API is the default. Mock/demo data must be opted into explicitly with
 * NEXT_PUBLIC_USE_MOCK_BRAND_VOICE=true — an unset flag must never silently
 * hide live data behind mocks.
 */
export function isBrandVoiceMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_BRAND_VOICE === "true";
}

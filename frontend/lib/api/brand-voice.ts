/**
 * Brand Voice API client.
 *
 * Read responses from the backend arrive in camelCase and map directly to the
 * frontend domain types (BrandProfile, BrandAsset).
 *
 * Write payloads must use snake_case to match the DRF serializer field names.
 * That mapping is intentionally isolated here — UI components only deal with
 * the camelCase domain types from @/types/brand-profile.
 */

import type {
  BannedPhrase,
  BrandAsset,
  BrandProfile,
  BrandVocabularyRule,
  BrandVoiceTone,
} from "@/types/brand-profile";

import { httpClient } from "./http-client";

// ---------------------------------------------------------------------------
// Write payload types (snake_case — DRF API contract)
// These are internal to the API layer. Components must not reference them.
// ---------------------------------------------------------------------------

export interface CreateBrandProfilePayload {
  /** Workspace primary key serialized as a string for frontend consistency. */
  workspace: string;
  name: string;
  audience: string;
  tone?: readonly BrandVoiceTone[];
  preferred_vocabulary?: readonly BrandVocabularyRuleWritePayload[];
  banned_phrases?: readonly BannedPhraseWritePayload[];
  positioning_notes?: string;
}

export type UpdateBrandProfilePayload = Partial<
  Omit<CreateBrandProfilePayload, "workspace">
>;

export interface CreateBrandAssetPayload {
  /** UUID string of the BrandProfile this asset belongs to. */
  brand_profile: string;
  title: string;
  content?: string;
  source_type?: "pasted" | "uploaded";
  format?: string;
  word_count?: number;
  status?: "ready" | "needs_review";
}

export type UpdateBrandAssetPayload = Partial<
  Omit<CreateBrandAssetPayload, "brand_profile">
>;

export interface BrandVocabularyRuleWritePayload {
  id: string;
  preferred_term: string;
  restricted_terms?: readonly string[];
  note?: string;
}

export interface BannedPhraseWritePayload {
  id: string;
  phrase: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// BrandProfile endpoints
// ---------------------------------------------------------------------------

/** Returns all BrandProfiles belonging to the authenticated user's workspaces. */
export function getBrandProfiles(): Promise<BrandProfile[]> {
  return httpClient.get<BrandProfile[]>("/api/brand-profiles/");
}

/** Returns a single BrandProfile by UUID. */
export function getBrandProfile(id: string): Promise<BrandProfile> {
  return httpClient.get<BrandProfile>(`/api/brand-profiles/${id}/`);
}

/** Creates a new BrandProfile in the specified workspace. */
export function createBrandProfile(
  payload: CreateBrandProfilePayload,
): Promise<BrandProfile> {
  return httpClient.post<BrandProfile>("/api/brand-profiles/", payload);
}

/** Partially updates a BrandProfile. Returns the updated resource. */
export function updateBrandProfile(
  id: string,
  payload: UpdateBrandProfilePayload,
): Promise<BrandProfile> {
  return httpClient.patch<BrandProfile>(`/api/brand-profiles/${id}/`, payload);
}

// ---------------------------------------------------------------------------
// BrandAsset endpoints
// ---------------------------------------------------------------------------

/**
 * Returns BrandAssets visible to the authenticated user.
 * Optionally scoped to a specific BrandProfile by UUID.
 */
export function getBrandAssets(brandProfileId?: string): Promise<BrandAsset[]> {
  const query = brandProfileId ? `?brand_profile=${brandProfileId}` : "";
  return httpClient.get<BrandAsset[]>(`/api/brand-assets/${query}`);
}

/** Returns a single BrandAsset by UUID. */
export function getBrandAsset(id: string): Promise<BrandAsset> {
  return httpClient.get<BrandAsset>(`/api/brand-assets/${id}/`);
}

/** Creates a new BrandAsset under the given BrandProfile. */
export function createBrandAsset(
  payload: CreateBrandAssetPayload,
): Promise<BrandAsset> {
  return httpClient.post<BrandAsset>("/api/brand-assets/", payload);
}

/** Partially updates a BrandAsset. Returns the updated resource. */
export function updateBrandAsset(
  id: string,
  payload: UpdateBrandAssetPayload,
): Promise<BrandAsset> {
  return httpClient.patch<BrandAsset>(`/api/brand-assets/${id}/`, payload);
}

/** Deletes a BrandAsset by UUID. */
export function deleteBrandAsset(id: string): Promise<void> {
  return httpClient.delete<void>(`/api/brand-assets/${id}/`);
}

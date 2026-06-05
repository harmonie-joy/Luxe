"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/components/ui/surface-card";
import {
  createContentBrief,
  type CreateContentBriefPayload,
} from "@/lib/api/content-briefs";
import { ApiError } from "@/lib/api/http-client";
import { APP_ROUTES } from "@/lib/routes";
import type { BrandProfile } from "@/types/brand-profile";
import type {
  CreateBriefPageData,
  CreateBriefSelectableOption,
} from "@/data/mock-create-brief";
import type { CampaignGoal, ContentChannel } from "@/types/content";

interface CreateBriefShellProps {
  data: CreateBriefPageData;
}

interface CreateBriefFormState {
  workspaceId: string;
  brandProfileId: string;
  contentObjective: string;
  campaignGoal: CampaignGoal;
  audience: string;
  angle: string;
  constraints: string;
  targetChannels: ContentChannel[];
}

function getInitialFormState(data: CreateBriefPageData): CreateBriefFormState {
  return {
    workspaceId: data.brief.workspaceId,
    brandProfileId: data.brief.brandProfileId,
    contentObjective: data.brief.contentObjective,
    campaignGoal: data.brief.campaignGoal,
    audience: data.brief.audience,
    angle: data.brief.angle,
    constraints: data.brief.constraints,
    targetChannels: [...data.brief.targetChannels],
  };
}

function getWorkspaceName(
  data: CreateBriefPageData,
  workspaceId: string,
): string {
  return (
    data.workspaces.find((workspace) => workspace.id === workspaceId)?.name ??
    "Workspace"
  );
}

function getBrandProfile(
  data: CreateBriefPageData,
  brandProfileId: string,
): BrandProfile | undefined {
  return data.brandProfiles.find((profile) => profile.id === brandProfileId);
}

function validateForm(
  state: CreateBriefFormState,
  availableProfiles: readonly BrandProfile[],
): string | null {
  if (!state.workspaceId) return "Choose a workspace before saving the brief.";
  if (!state.brandProfileId) {
    return "Choose a brand voice profile before saving the brief.";
  }
  if (
    !availableProfiles.some((profile) => profile.id === state.brandProfileId)
  ) {
    return "Choose a brand voice profile that belongs to the selected workspace.";
  }
  if (!state.contentObjective.trim()) {
    return "Add a content objective before saving the brief.";
  }
  if (!state.campaignGoal) return "Choose a campaign goal before saving the brief.";
  if (!state.audience.trim()) {
    return "Add an audience before saving the brief.";
  }
  if (state.targetChannels.length === 0) {
    return "Choose at least one target channel before saving the brief.";
  }

  return null;
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `API error ${error.status}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return "The brief could not be saved. Please try again.";
}

function renderSelectableOptions<TValue extends CampaignGoal | ContentChannel>(
  options: readonly CreateBriefSelectableOption<TValue>[],
  name: string,
  selectedValues: readonly TValue[],
  onChange: (value: TValue, checked: boolean) => void,
) {
  return options.map((option) => (
    <label
      className="luxe-chip flex items-start gap-3 rounded-sm px-4 py-3"
      key={option.value}
    >
      <input
        checked={selectedValues.includes(option.value)}
        className="mt-1"
        name={name}
        onChange={(event) => onChange(option.value, event.target.checked)}
        type={name === "targetChannels" ? "checkbox" : "radio"}
        value={option.value}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{option.label}</span>
        <span className="luxe-chip-description mt-1 block text-xs leading-5">
          {option.description}
        </span>
      </span>
    </label>
  ));
}

export function CreateBriefShell({ data }: CreateBriefShellProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<CreateBriefFormState>(() =>
    getInitialFormState(data),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const availableProfiles = useMemo(
    () =>
      data.brandProfiles.filter(
        (profile) => profile.workspaceId === formState.workspaceId,
      ),
    [data.brandProfiles, formState.workspaceId],
  );

  const selectedWorkspaceName = getWorkspaceName(data, formState.workspaceId);
  const selectedBrandProfile = getBrandProfile(data, formState.brandProfileId);
  const selectedChannelLabels = data.channelOptions
    .filter((option) => formState.targetChannels.includes(option.value))
    .map((option) => option.label);

  function handleWorkspaceChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextWorkspaceId = event.target.value;
    const nextProfiles = data.brandProfiles.filter(
      (profile) => profile.workspaceId === nextWorkspaceId,
    );

    setFormState((current) => {
      const currentProfileStillAvailable = nextProfiles.some(
        (profile) => profile.id === current.brandProfileId,
      );

      return {
        ...current,
        workspaceId: nextWorkspaceId,
        brandProfileId: currentProfileStillAvailable
          ? current.brandProfileId
          : (nextProfiles[0]?.id ?? ""),
      };
    });
    setFormMessage(null);
    setApiError(null);
  }

  function updateField(
    field: keyof Omit<CreateBriefFormState, "campaignGoal" | "targetChannels">,
    value: string,
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
    setFormMessage(null);
    setApiError(null);
  }

  function handleCampaignGoalChange(value: CampaignGoal) {
    setFormState((current) => ({ ...current, campaignGoal: value }));
    setFormMessage(null);
    setApiError(null);
  }

  function handleTargetChannelChange(
    value: ContentChannel,
    checked: boolean,
  ) {
    setFormState((current) => {
      const nextChannels = checked
        ? [...current.targetChannels, value]
        : current.targetChannels.filter((channel) => channel !== value);

      return {
        ...current,
        targetChannels: Array.from(new Set(nextChannels)),
      };
    });
    setFormMessage(null);
    setApiError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm(formState, availableProfiles);
    if (validationError) {
      setFormMessage(validationError);
      setApiError(null);
      return;
    }

    const payload: CreateContentBriefPayload = {
      workspace: formState.workspaceId,
      brand_profile: formState.brandProfileId,
      content_objective: formState.contentObjective.trim(),
      campaign_goal: formState.campaignGoal,
      audience: formState.audience.trim(),
      angle: formState.angle.trim(),
      constraints: formState.constraints.trim(),
      target_channels: formState.targetChannels,
    };

    setIsSubmitting(true);
    setFormMessage(null);
    setApiError(null);

    try {
      await createContentBrief(payload);
      setFormMessage("Brief saved. Opening Draft Studio.");
      router.push(APP_ROUTES.drafts);
    } catch (error) {
      setApiError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      <header className="max-w-4xl">
        <p className="luxe-eyebrow">{data.pageHeader.eyebrow}</p>
        <h1 className="luxe-page-title mt-3">{data.pageHeader.title}</h1>
        <p className="luxe-page-description mt-4">{data.pageHeader.description}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <SurfaceCard className="flex flex-col gap-8">
          <div>
            <p className="luxe-eyebrow">Brief Setup</p>
            <h2 className="luxe-section-title mt-2">Structured Content Brief</h2>
            <p className="luxe-form-help mt-2">
              Use the backend-aligned fields below to create a brief for the
              draft workflow.
            </p>
          </div>

          <form
            aria-label="Create brief form"
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="luxe-form-label" htmlFor="workspace">
                  Workspace
                </label>
                <select
                  className="luxe-field mt-2 h-12 w-full px-4"
                  id="workspace"
                  name="workspace"
                  onChange={handleWorkspaceChange}
                  value={formState.workspaceId}
                >
                  {data.workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="luxe-form-label" htmlFor="brand-profile">
                  Brand Voice Profile
                </label>
                <select
                  className="luxe-field mt-2 h-12 w-full px-4"
                  id="brand-profile"
                  name="brandProfile"
                  onChange={(event) =>
                    updateField("brandProfileId", event.target.value)
                  }
                  value={formState.brandProfileId}
                >
                  {availableProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                  {availableProfiles.length === 0 ? (
                    <option value="">No profiles available</option>
                  ) : null}
                </select>
              </div>
            </div>

            <div>
              <label className="luxe-form-label" htmlFor="content-objective">
                Content objective
              </label>
              <textarea
                className="luxe-field mt-2 min-h-32 w-full resize-none px-4 py-3"
                id="content-objective"
                name="contentObjective"
                onChange={(event) =>
                  updateField("contentObjective", event.target.value)
                }
                placeholder="What outcome should this content create?"
                value={formState.contentObjective}
              />
            </div>

            <div>
              <span className="luxe-form-label">Campaign goal</span>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {renderSelectableOptions(
                  data.campaignGoalOptions,
                  "campaignGoal",
                  [formState.campaignGoal],
                  (value) => handleCampaignGoalChange(value),
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="luxe-form-label" htmlFor="audience">
                  Audience
                </label>
                <textarea
                  className="luxe-field mt-2 min-h-32 w-full resize-none px-4 py-3"
                  id="audience"
                  name="audience"
                  onChange={(event) => updateField("audience", event.target.value)}
                  placeholder="Who should this content speak to?"
                  value={formState.audience}
                />
              </div>

              <div>
                <label className="luxe-form-label" htmlFor="angle">
                  Angle
                </label>
                <textarea
                  className="luxe-field mt-2 min-h-32 w-full resize-none px-4 py-3"
                  id="angle"
                  name="angle"
                  onChange={(event) => updateField("angle", event.target.value)}
                  placeholder="What perspective or narrative angle should lead?"
                  value={formState.angle}
                />
              </div>
            </div>

            <div>
              <label className="luxe-form-label" htmlFor="constraints">
                Constraints
              </label>
              <textarea
                className="luxe-field mt-2 min-h-28 w-full resize-none px-4 py-3"
                id="constraints"
                name="constraints"
                onChange={(event) => updateField("constraints", event.target.value)}
                placeholder="Add guardrails, required disclaimers, or language limits."
                value={formState.constraints}
              />
            </div>

            <div>
              <span className="luxe-form-label">Target channels</span>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {renderSelectableOptions(
                  data.channelOptions,
                  "targetChannels",
                  formState.targetChannels,
                  handleTargetChannelChange,
                )}
              </div>
            </div>

            <div aria-live="polite" className="space-y-3">
              {formMessage ? (
                <p className="luxe-preview-stat p-4 text-sm font-medium">
                  {formMessage}
                </p>
              ) : null}
              {apiError ? (
                <p className="luxe-preview-stat p-4 text-sm font-medium text-luxe-danger">
                  {apiError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-(--color-border-subtle) pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="luxe-form-help">
                Saves to the existing ContentBrief API. Auth/session setup is
                still required for a real backend session.
              </p>
              <button
                className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Saving brief..." : "Save brief"}
              </button>
            </div>
          </form>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="flex flex-col gap-5">
            <div>
              <p className="luxe-eyebrow">Active Context</p>
              <h2 className="luxe-section-title mt-2">Brief Snapshot</h2>
            </div>

            <div className="space-y-4">
              <div className="luxe-preview-stat p-4">
                <p className="luxe-eyebrow">Workspace</p>
                <p className="mt-2 text-sm font-semibold">{selectedWorkspaceName}</p>
              </div>

              <div className="luxe-preview-stat p-4">
                <p className="luxe-eyebrow">Brand Voice</p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedBrandProfile?.name ?? "Not selected"}
                </p>
                <p className="luxe-form-help mt-2">
                  {selectedBrandProfile?.positioningNotes ??
                    "Choose a profile to see positioning guidance."}
                </p>
              </div>

              <div className="luxe-preview-stat p-4">
                <p className="luxe-eyebrow">Target Channels</p>
                {selectedChannelLabels.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {selectedChannelLabels.map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="luxe-form-help mt-2">No channels selected.</p>
                )}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="flex flex-col gap-4">
            <div>
              <p className="luxe-eyebrow">API Contract</p>
              <h2 className="luxe-section-title mt-2">Backend-Ready Shape</h2>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Endpoint</dt>
                <dd className="font-medium">
                  <code>/api/content-briefs/</code>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Fields</dt>
                <dd className="text-right font-medium">
                  workspace, brand_profile, campaign_goal, content_objective,
                  audience, angle, constraints, target_channels
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Response</dt>
                <dd className="text-right font-medium">
                  CamelCase <code>ContentBrief</code>
                </dd>
              </div>
            </dl>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

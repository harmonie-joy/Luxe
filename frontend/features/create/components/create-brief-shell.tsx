import { SurfaceCard } from "@/components/ui/surface-card";
import type { BrandProfile } from "@/types/brand-profile";
import type {
  CreateBriefPageData,
  CreateBriefSelectableOption,
} from "@/data/mock-create-brief";
import type { CampaignGoal, ContentChannel } from "@/types/content";

interface CreateBriefShellProps {
  data: CreateBriefPageData;
}

function getSelectedWorkspaceName(data: CreateBriefPageData): string {
  return data.workspaces.find((workspace) => workspace.selected)?.name ?? "Workspace";
}

function getSelectedBrandProfile(
  data: CreateBriefPageData,
): BrandProfile | undefined {
  return data.brandProfiles.find(
    (profile) => profile.id === data.brief.brandProfileId,
  );
}

function renderSelectableOptions<TValue extends CampaignGoal | ContentChannel>(
  options: readonly CreateBriefSelectableOption<TValue>[],
  name: string,
) {
  return options.map((option) => (
    <label
      className="luxe-chip flex items-start gap-3 rounded-sm px-4 py-3"
      key={option.value}
    >
      <input
        checked={option.selected}
        className="mt-1"
        name={name}
        readOnly
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
  const selectedWorkspaceName = getSelectedWorkspaceName(data);
  const selectedBrandProfile = getSelectedBrandProfile(data);
  const availableProfiles = data.brandProfiles.filter(
    (profile) => profile.workspaceId === data.brief.workspaceId,
  );
  const selectedChannelLabels = data.channelOptions
    .filter((option) => option.selected)
    .map((option) => option.label);

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
              This shell uses backend-aligned fields and mock defaults. Save
              wiring can attach directly to the `ContentBrief` API contract next.
            </p>
          </div>

          <form aria-label="Create brief form" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="luxe-form-label" htmlFor="workspace">
                  Workspace
                </label>
                <select
                  className="luxe-field mt-2 h-12 w-full px-4"
                  defaultValue={data.brief.workspaceId}
                  id="workspace"
                  name="workspace"
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
                  defaultValue={data.brief.brandProfileId}
                  id="brand-profile"
                  name="brandProfile"
                >
                  {availableProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="luxe-form-label" htmlFor="content-objective">
                Content objective
              </label>
              <textarea
                className="luxe-field mt-2 min-h-32 w-full resize-none px-4 py-3"
                defaultValue={data.brief.contentObjective}
                id="content-objective"
                name="contentObjective"
                placeholder="What outcome should this content create?"
              />
            </div>

            <div>
              <span className="luxe-form-label">Campaign goal</span>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {renderSelectableOptions(data.campaignGoalOptions, "campaignGoal")}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="luxe-form-label" htmlFor="audience">
                  Audience
                </label>
                <textarea
                  className="luxe-field mt-2 min-h-32 w-full resize-none px-4 py-3"
                  defaultValue={data.brief.audience}
                  id="audience"
                  name="audience"
                  placeholder="Who should this content speak to?"
                />
              </div>

              <div>
                <label className="luxe-form-label" htmlFor="angle">
                  Angle
                </label>
                <textarea
                  className="luxe-field mt-2 min-h-32 w-full resize-none px-4 py-3"
                  defaultValue={data.brief.angle}
                  id="angle"
                  name="angle"
                  placeholder="What perspective or narrative angle should lead?"
                />
              </div>
            </div>

            <div>
              <label className="luxe-form-label" htmlFor="constraints">
                Constraints
              </label>
              <textarea
                className="luxe-field mt-2 min-h-28 w-full resize-none px-4 py-3"
                defaultValue={data.brief.constraints}
                id="constraints"
                name="constraints"
                placeholder="Add guardrails, required disclaimers, or language limits."
              />
            </div>

            <div>
              <span className="luxe-form-label">Target channels</span>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {renderSelectableOptions(data.channelOptions, "targetChannels")}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-(--color-border-subtle) pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="luxe-form-help">
                MVP shell only. The backend model and API contract are ready,
                but this button does not submit yet.
              </p>
              <button
                className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold"
                type="button"
              >
                Save brief
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
                <ul className="mt-3 space-y-2 text-sm">
                  {selectedChannelLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
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

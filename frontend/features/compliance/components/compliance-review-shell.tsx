import Link from "next/link";

import { StatusIndicator } from "@/components/ui/status-indicator";
import type { StatusIndicatorTone } from "@/components/ui/status-indicator";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ComplianceReviewPageData } from "@/features/compliance/data/get-compliance-review-page";
import {
  COMPLIANCE_CATEGORY_LABELS,
  COMPLIANCE_SEVERITY_LABELS,
  COMPLIANCE_STATUS_LABELS,
  CONTENT_CHANNEL_LABELS,
  DRAFT_STATUS_LABELS,
  formatDisplayDate,
} from "@/lib/formatters";
import {
  APP_ROUTES,
  complianceReviewRoute,
} from "@/lib/routes";
import type {
  ComplianceCategory,
  ComplianceIssue,
  ComplianceSeverity,
  ComplianceStatus,
} from "@/types/compliance";

interface ComplianceReviewShellProps {
  data: ComplianceReviewPageData;
}

const COMPLIANCE_STATUS_TONES = {
  green: "success",
  yellow: "warning",
  red: "critical",
} as const satisfies Record<ComplianceStatus, StatusIndicatorTone>;

const COMPLIANCE_SEVERITY_TONES = {
  low: "neutral",
  medium: "warning",
  high: "critical",
} as const satisfies Record<ComplianceSeverity, StatusIndicatorTone>;

const COMPLIANCE_CATEGORY_ORDER = [
  "gdpr",
  "consent",
  "ip",
  "claims",
] as const satisfies readonly ComplianceCategory[];

function issuesForCategory(
  issues: readonly ComplianceIssue[],
  category: ComplianceCategory,
): ComplianceIssue[] {
  return issues.filter((issue) => issue.category === category);
}

export function ComplianceReviewShell({ data }: ComplianceReviewShellProps) {
  const { check, draft } = data;
  const statusTone = COMPLIANCE_STATUS_TONES[check.status];

  return (
    <div className="flex min-h-full flex-col gap-8">
      <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
        <div className="max-w-4xl">
          <p className="luxe-eyebrow">{data.pageHeader.eyebrow}</p>
          <h1 className="luxe-page-title mt-3">{data.pageHeader.title}</h1>
          <p className="luxe-page-description mt-4">
            {data.pageHeader.description}
          </p>
        </div>

        <SurfaceCard className="flex flex-col gap-4" padding="sm">
          <div className="flex items-center justify-between gap-4">
            <p className="luxe-eyebrow">Traffic Light</p>
            <StatusIndicator
              label={COMPLIANCE_STATUS_LABELS[check.status]}
              tone={statusTone}
              uppercase
            />
          </div>
          <p className="text-sm leading-6 text-(--color-text-secondary)">
            Checked {formatDisplayDate(check.checkedAt)}
          </p>
        </SurfaceCard>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-w-0 flex-col gap-6">
          <SurfaceCard className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 border-b border-(--color-border-subtle) pb-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="luxe-eyebrow">Draft Under Review</p>
                <h2 className="luxe-section-title mt-2">{draft.title}</h2>
                <p className="mt-3 text-sm leading-6 text-(--color-text-secondary)">
                  {CONTENT_CHANNEL_LABELS[draft.channel]} -{" "}
                  {DRAFT_STATUS_LABELS[draft.status]}
                </p>
              </div>

              <Link
                className="luxe-secondary-action luxe-focus-ring rounded-sm px-4 py-2 text-center text-sm font-semibold"
                href={APP_ROUTES.drafts}
              >
                Edit draft
              </Link>
            </div>

            <div className="luxe-preview-stat p-5">
              <p className="luxe-label-sm">Review Summary</p>
              <p className="mt-3 text-sm leading-6">{check.summary}</p>
            </div>

            <div>
              <p className="luxe-eyebrow">Draft Copy</p>
              <div className="mt-3 whitespace-pre-line rounded-sm border border-(--color-border-subtle) bg-(--color-surface-muted) p-5 text-sm leading-7">
                {draft.content}
              </div>
            </div>
          </SurfaceCard>

          <section className="flex flex-col gap-5">
            {COMPLIANCE_CATEGORY_ORDER.map((category) => {
              const categoryIssues = issuesForCategory(check.issues, category);

              return (
                <SurfaceCard className="flex flex-col gap-5" key={category}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="luxe-eyebrow">Issue Category</p>
                      <h2 className="luxe-section-title mt-2">
                        {COMPLIANCE_CATEGORY_LABELS[category]}
                      </h2>
                    </div>
                    <p className="luxe-form-help">
                      {categoryIssues.length === 1
                        ? "1 issue"
                        : `${categoryIssues.length} issues`}
                    </p>
                  </div>

                  {categoryIssues.length > 0 ? (
                    <div className="luxe-list-divider">
                      {categoryIssues.map((issue) => (
                        <article className="py-5 first:pt-0 last:pb-0" key={issue.id}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base font-semibold">
                                {issue.title}
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-(--color-text-secondary)">
                                {issue.explanation}
                              </p>
                            </div>
                            <StatusIndicator
                              label={COMPLIANCE_SEVERITY_LABELS[issue.severity]}
                              tone={COMPLIANCE_SEVERITY_TONES[issue.severity]}
                              uppercase
                            />
                          </div>

                          <div className="luxe-preview-stat mt-4 p-4">
                            <p className="luxe-label-sm">Suggested Fix</p>
                            <p className="mt-2 text-sm leading-6">
                              {issue.suggestedFix || "No suggested fix supplied."}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="luxe-preview-stat p-4">
                      <p className="text-sm leading-6 text-(--color-text-secondary)">
                        No issues flagged in this category for the current check.
                      </p>
                    </div>
                  )}
                </SurfaceCard>
              );
            })}
          </section>
        </main>

        <aside className="space-y-6">
          <SurfaceCard className="flex flex-col gap-4">
            <div>
              <p className="luxe-eyebrow">Review Snapshot</p>
              <h2 className="luxe-section-title mt-2">
                {COMPLIANCE_STATUS_LABELS[check.status]} status
              </h2>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Issues</dt>
                <dd className="font-medium">{check.issues.length}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Last checked</dt>
                <dd className="font-medium">
                  {formatDisplayDate(check.checkedAt)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Check ID</dt>
                <dd className="max-w-48 truncate text-right font-medium">
                  {check.id}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Draft ID</dt>
                <dd className="max-w-48 truncate text-right font-medium">
                  {draft.id}
                </dd>
              </div>
            </dl>
          </SurfaceCard>

          <SurfaceCard className="flex flex-col gap-4">
            <div>
              <p className="luxe-eyebrow">Other Drafts</p>
              <h2 className="luxe-section-title mt-2">Review another channel</h2>
            </div>

            <nav aria-label="Compliance draft reviews" className="space-y-2">
              {data.relatedDrafts.map((relatedDraft) => {
                const active = relatedDraft.id === draft.id;

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "luxe-primary-action luxe-focus-ring block rounded-sm px-4 py-3 text-sm font-semibold"
                        : "luxe-secondary-action luxe-focus-ring block rounded-sm px-4 py-3 text-sm font-semibold"
                    }
                    href={complianceReviewRoute(relatedDraft.id)}
                    key={relatedDraft.id}
                  >
                    {CONTENT_CHANNEL_LABELS[relatedDraft.channel]}
                  </Link>
                );
              })}
            </nav>
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}

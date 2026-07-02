import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComplianceReviewShell } from "@/features/compliance/components/compliance-review-shell";
import { getComplianceReviewPage } from "@/features/compliance/data/get-compliance-review-page";
import {
  COMPLIANCE_CATEGORY_LABELS,
  COMPLIANCE_SEVERITY_LABELS,
  COMPLIANCE_STATUS_LABELS,
} from "@/lib/formatters";

async function pageDataFor(draftId: string) {
  const data = await getComplianceReviewPage(draftId);
  if (!data) throw new Error(`No mock compliance page for ${draftId}`);
  return data;
}

describe("ComplianceReviewShell", () => {
  it("renders the traffic-light status, issues, and severities", async () => {
    const data = await pageDataFor("draft-private-preview-linkedin");
    render(<ComplianceReviewShell data={data} />);

    const statusLabel = COMPLIANCE_STATUS_LABELS[data.check.status];
    expect(screen.getAllByText(statusLabel).length).toBeGreaterThan(0);
    expect(screen.getByText(`${statusLabel} status`)).toBeTruthy();

    for (const issue of data.check.issues) {
      expect(screen.getByText(issue.title)).toBeTruthy();
      expect(
        screen.getAllByText(COMPLIANCE_SEVERITY_LABELS[issue.severity]).length,
      ).toBeGreaterThan(0);
    }
    // All four category sections always render.
    for (const label of Object.values(COMPLIANCE_CATEGORY_LABELS)) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("shows the empty state for categories without issues", async () => {
    const data = await pageDataFor("draft-private-preview-newsletter");
    render(<ComplianceReviewShell data={data} />);

    const flaggedCategories = new Set(
      data.check.issues.map((issue) => issue.category),
    );
    const emptyStates = screen.getAllByText(
      "No issues flagged in this category for the current check.",
    );
    expect(emptyStates.length).toBe(4 - flaggedCategories.size);
  });

  it("links each related draft to its compliance review", async () => {
    const data = await pageDataFor("draft-private-preview-linkedin");
    render(<ComplianceReviewShell data={data} />);

    const nav = screen.getByRole("navigation", {
      name: "Compliance draft reviews",
    });
    for (const relatedDraft of data.relatedDrafts) {
      expect(
        nav.querySelector(`a[href="/compliance/${relatedDraft.id}"]`),
      ).toBeTruthy();
    }
  });
});

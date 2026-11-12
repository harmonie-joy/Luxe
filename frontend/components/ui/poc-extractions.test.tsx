import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaPreviewCard } from "./media-preview-card";
import { StatCounterCard } from "./stat-counter-card";
import { StatusPillFilter } from "./status-pill-filter";
import { StepProgressHeader } from "./step-progress-header";
import { GalleryGridLayout } from "../layouts/gallery-grid-layout";
import { DashboardShellLayout } from "../layouts/dashboard-shell-layout";
import { SplitPaneLayout } from "../layouts/split-pane-layout";
import { WizardLayout } from "../layouts/wizard-layout";

describe("POC extracted primitives and slots", () => {
  it("retains semantic metric markup and consumer typography", () => {
    render(<dl><StatCounterCard label="Ideas" value={0} className="counter" valueClassName="luxe-serif" /></dl>);
    expect(screen.getByText("Ideas").tagName).toBe("DT");
    expect(screen.getByText("0").tagName).toBe("DD");
    expect(screen.getByText("0").className).toBe("luxe-serif");
  });

  it("preserves pressed state, counts, and calendar toggle-off behavior", () => {
    const change = vi.fn();
    const view = render(<StatusPillFilter label="Statuses" value="Ready" onChange={change} options={[{ value: "Ready", label: "Ready", count: 0 }, { value: "Review", label: "Review", count: 2 }]} />);
    expect(screen.getByRole("button", { name: "Ready" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(change).toHaveBeenCalledWith("Review");
    view.rerender(<StatusPillFilter label="Platforms" role="group" value="instagram" toggleValue="all" onChange={change} options={[{ value: "instagram", label: "Instagram", content: <span>IG</span> }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Instagram" }));
    expect(change).toHaveBeenCalledWith("all");
  });

  it("keeps current and completed steps without extra heading or wrapper markup", () => {
    render(<StepProgressHeader label="Progress" className="steps" currentStep={1} markCompleted completedMarker="Done" steps={[{ id: "idea", label: "Idea" }, { id: "review", label: <small>Review</small> }]} />);
    const list = screen.getByRole("list", { name: "Progress" });
    expect(list.children[0].getAttribute("data-complete")).toBe("true");
    expect(list.children[1].getAttribute("aria-current")).toBe("step");
    expect(list.children[1].querySelector("small")?.textContent).toBe("Review");
  });

  it("keeps media and overlay as direct children with sizing supplied by the consumer", () => {
    render(<MediaPreviewCard className="artwork" data-format="portrait" image={{ src: "/preview.jpg", alt: "Original asset", width: 200, height: 200 }}><span>Working overlay</span></MediaPreviewCard>);
    const media = screen.getByRole("img", { name: "Original asset" }).parentElement!;
    expect(media.className).toBe("artwork");
    expect(media.getAttribute("data-format")).toBe("portrait");
    expect(media.children).toHaveLength(2);
  });

  it("renders layout slots shallowly and preserves semantic section attributes", () => {
    const view = render(<WizardLayout aria-label="Plan" className="section" header={<h2>Plan</h2>} progress={<ol />} footer={<button>Continue</button>}><form aria-label="Decisions" /></WizardLayout>);
    expect(screen.getByRole("region", { name: "Plan" }).children).toHaveLength(4);
    view.rerender(<SplitPaneLayout as="section" aria-label="Post dashboard" className="dashboard" primary={<div>Original</div>} secondary={<aside>Inspector</aside>} />);
    expect(screen.getByRole("region", { name: "Post dashboard" }).children).toHaveLength(2);
    view.rerender(<GalleryGridLayout header={<header>Library</header>} toolbar={<input aria-label="Search" />} filters={<nav aria-label="Filters" />} footer={<footer>Actions</footer>}><section aria-label="Gallery" /></GalleryGridLayout>);
    expect(screen.getByRole("region", { name: "Gallery" }).parentElement?.children).toHaveLength(5);
  });

  it("preserves the existing dashboard sidebar shell and supports an unframed feature canvas", () => {
    const view = render(<DashboardShellLayout header={<header>Header</header>} sidebar={<nav aria-label="Pages" />} mainId="poc-main" footer={<footer>Footer</footer>}><section aria-label="Canvas" /></DashboardShellLayout>);
    expect(screen.getByRole("main").id).toBe("poc-main");
    expect(screen.getByRole("main").className).toBe("luxe-pocs-main");
    expect(screen.getByRole("navigation", { name: "Pages" }).parentElement?.className).toBe("luxe-pocs-sidebar");
    view.rerender(<DashboardShellLayout className="page" header={<header>Home</header>}><section aria-label="Canvas" /></DashboardShellLayout>);
    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.getByRole("region", { name: "Canvas" }).parentElement?.className).toBe("page");
    expect(screen.getByRole("region", { name: "Canvas" }).parentElement?.children).toHaveLength(2);
  });
});
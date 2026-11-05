import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import { StageFlowFooter } from "./stage-flow-footer";
import { StageFlowFooter as SharedStageFlowFooter } from "@/components/pocs/stage-flow-footer";

describe("StageFlowFooter", () => {
  it("shows a step counter and explicit Back and Continue navigation", () => {
    render(<SharedStageFlowFooter prevRoute="/pocs/welcome" nextRoute="/pocs/creator-dna" currentStep={2} totalSteps={5} />);
    expect(screen.getByText("Step 2 of 5")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(router.push).toHaveBeenNthCalledWith(1, "/pocs/welcome");
    expect(router.push).toHaveBeenNthCalledWith(2, "/pocs/creator-dna");
  });

  it("navigates to the previous and next routes", () => {
    render(<StageFlowFooter backHref="/pocs/welcome" nextHref="/pocs/discover-me" nextLabel="Get Started" completeStep="welcome" />);

    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    fireEvent.click(screen.getByRole("button", { name: /Get Started/ }));

    expect(router.push).toHaveBeenNthCalledWith(1, "/pocs/welcome");
    expect(router.push).toHaveBeenNthCalledWith(2, "/pocs/discover-me");
    expect(JSON.parse(sessionStorage.getItem("luxe-pocs-stage1-profile") ?? "{}").completedSteps).toEqual(["welcome"]);
  });

  it("keeps the next action unavailable until the current step is complete", () => {
    render(<StageFlowFooter backHref="/pocs/welcome" nextHref="/pocs/creator-dna" nextLabel="Save & Generate DNA" nextDisabled />);

    expect(screen.getByRole("button", { name: /Save & Generate DNA/ }).hasAttribute("disabled")).toBe(true);
  });

  it("supports a final step with no next route", () => {
    render(<SharedStageFlowFooter prevRoute="/pocs/single-post" currentStep={5} totalSteps={5} />);

    expect(screen.getByText("Step 5 of 5")).toBeDefined();
    expect(screen.getByRole("button", { name: /Back/ })).toBeDefined();
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
  });
});
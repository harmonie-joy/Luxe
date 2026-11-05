import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { StageFlowNavigation } from "./stage-flow-navigation";

describe("StageFlowNavigation", () => {
  beforeEach(() => {
    sessionStorage.setItem("luxe-pocs-stage1-profile", JSON.stringify({
      answers: [],
      tone: "Warm and direct",
      communicationStyle: "",
      completedSteps: ["welcome", "discover-me"],
    }));
  });

  it("shows the requested routes in order and identifies the current step", () => {
    render(<StageFlowNavigation currentStep="creator-dna" />);

    const navigation = within(screen.getByRole("navigation", { name: "Stage 1 page flow" }));
    expect(navigation.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/pocs/welcome",
      "/pocs/discover-me",
      "/pocs/creator-dna",
      "/pocs/brand-kit",
      "/pocs/brand-assets",
    ]);
    expect(navigation.getByRole("link", { name: /Creator DNA/ }).getAttribute("aria-current")).toBe("step");
    expect(navigation.getByRole("link", { name: /Welcome/ }).getAttribute("data-complete")).toBe("true");
    expect(navigation.getByRole("link", { name: /Discover Me/ }).getAttribute("data-complete")).toBe("true");
    expect(navigation.getByRole("link", { name: /Brand Kit/ }).getAttribute("data-complete")).toBe("false");
  });

  it("keeps the sequence available without marking the optional inspiration detour as a step", () => {
    render(<StageFlowNavigation />);

    const navigation = screen.getByRole("navigation", { name: "Stage 1 page flow" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(5);
    expect(navigation.querySelector('[aria-current="step"]')).toBeNull();
    expect(screen.getByText("Optional inspiration detour")).toBeDefined();
  });
});
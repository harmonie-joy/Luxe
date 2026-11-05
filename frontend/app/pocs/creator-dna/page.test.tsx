import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SandboxLayout from "../layout";
import DiscoverMePage from "../discover-me/page";
import CreatorDnaPage from "./page";

describe("Creator DNA prototype", () => {
  it("updates DNA from chat choices across navigation within the shared provider", () => {
    sessionStorage.setItem("luxe-pocs-stage1-profile", JSON.stringify({
      answers: [],
      dimensionSummaries: { "north-star": "Old saved summary" },
    }));
    const view = render(<SandboxLayout><DiscoverMePage /></SandboxLayout>);
    fireEvent.click(screen.getByRole("button", { name: /Start chat/ }));
    fireEvent.click(screen.getByRole("button", { name: "Feel seen" }));
    fireEvent.click(screen.getByRole("button", { name: "A useful idea" }));
    fireEvent.click(screen.getByRole("button", { name: "Warm and direct" }));
    view.rerender(<SandboxLayout><CreatorDnaPage /></SandboxLayout>);
    expect(within(screen.getByRole("region", { name: "My North Star" })).getByText("Feel seen")).toBeDefined();
    expect(within(screen.getByRole("region", { name: "Communication Style" })).getByText("A useful idea")).toBeDefined();
    expect(within(screen.getByRole("region", { name: "Voice & Tone" })).getByText("Warm and direct")).toBeDefined();
    expect(screen.queryByText("Old saved summary")).toBeNull();
  });

  it("shows a reusable profile, filters dimensions, and explains the edit source", () => {
    render(<SandboxLayout><CreatorDnaPage /></SandboxLayout>);

    expect(screen.getByRole("heading", { name: "Your Creator DNA" })).toBeDefined();
    expect(screen.getByText(/from Discover Me/i)).toBeDefined();
    expect(within(screen.getByRole("navigation", { name: "Sandbox pages" })).getByRole("link", { name: "Creator DNA" }).getAttribute("href")).toBe("/pocs/creator-dna");
    expect(screen.getByRole("heading", { name: "My North Star" })).toBeDefined();
    expect(screen.getByRole("progressbar", { name: "92% complete" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /^Workflow$/ }));
    expect(screen.getByRole("heading", { name: "Workflow" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "My North Star" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "All dimensions" }));
    expect(screen.getByRole("heading", { name: "My North Star" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Voice & Tone summary" }), {
      target: { value: "Warm and direct" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(within(screen.getByRole("region", { name: "Voice & Tone" })).getByText("Warm and direct")).toBeDefined();
  });

  it("loads Discover Me answers into the editable DNA dimensions", () => {
    sessionStorage.setItem("luxe-pocs-stage1-profile", JSON.stringify({
      answers: ["Feel seen", "A useful idea", "Warm and direct"],
      tone: "Warm and direct",
      communicationStyle: "A useful idea",
    }));
    render(<SandboxLayout><CreatorDnaPage /></SandboxLayout>);

    expect(within(screen.getByRole("region", { name: "My North Star" })).getByText("Feel seen")).toBeDefined();
    expect(within(screen.getByRole("region", { name: "Communication Style" })).getByText("A useful idea")).toBeDefined();
    expect(within(screen.getByRole("region", { name: "Voice & Tone" })).getByText("Warm and direct")).toBeDefined();
  });
});
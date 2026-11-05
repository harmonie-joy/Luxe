import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import DiscoverMePage from "./page";

describe("Discover Me prototype", () => {
  it("moves between the three screens and supports chat and consultation interactions", () => {
    render(<SandboxLayout><DiscoverMePage /></SandboxLayout>);

    expect(screen.getByRole("heading", { name: "Let’s get to know you" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Start chat/ }));
    expect(screen.getByRole("heading", { name: "A conversation, at your pace" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Feel seen" }));
    expect(screen.getByText("Feel seen")).toBeDefined();
    expect(screen.getByText("What do you want people to remember after spending time with your work?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Play voice sample" }));
    expect(screen.getByText("Playing a short sample")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Brand consultation/ }));
    expect(screen.getByRole("heading", { name: "Live Brand Consultation" })).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "AI assistant" }));
    expect(screen.getByText(/Maya is exploring how your personal point of view/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Messaging & tone/ }));
    expect(screen.getByRole("button", { name: /Messaging & tone/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Turn camera off" }));
    expect(screen.getByText("Camera off")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Start screen share" }));
    expect(screen.getByText("Screen sharing preview")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "End call" }));
    expect(screen.getByRole("button", { name: "Resume call" })).toBeDefined();
    const footer = within(screen.getByRole("region", { name: "Wizard actions" }));
    expect(footer.getByRole("button", { name: /Save & Generate DNA/ }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(footer.getByRole("button", { name: /Save & Generate DNA/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/creator-dna");
  });

  it("saves all chat answers and enables the next wizard step", () => {
    sessionStorage.clear();
    render(<SandboxLayout><DiscoverMePage /></SandboxLayout>);

    fireEvent.click(screen.getByRole("button", { name: /Start chat/ }));
    fireEvent.click(screen.getByRole("button", { name: "Feel seen" }));
    fireEvent.click(screen.getByRole("button", { name: "A useful idea" }));
    fireEvent.click(screen.getByRole("button", { name: "Warm and direct" }));

    expect(JSON.parse(sessionStorage.getItem("luxe-pocs-stage1-profile") ?? "{}")).toMatchObject({
      answers: ["Feel seen", "A useful idea", "Warm and direct"],
      tone: "Warm and direct",
    });
    expect(screen.getByText(/Your answers are ready to shape your DNA/)).toBeDefined();

    const footer = within(screen.getByRole("region", { name: "Wizard actions" }));
    fireEvent.click(footer.getByRole("button", { name: /Save & Generate DNA/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/creator-dna");
  });

  it("reopens a saved chat in its completed state", () => {
    sessionStorage.setItem("luxe-pocs-stage1-profile", JSON.stringify({
      answers: ["Feel seen", "A useful idea", "Warm and direct"],
      tone: "Warm and direct",
      communicationStyle: "A useful idea",
      completedSteps: ["welcome"],
    }));
    render(<SandboxLayout><DiscoverMePage /></SandboxLayout>);

    expect(screen.getByRole("heading", { name: "A conversation, at your pace" })).toBeDefined();
    expect(screen.getByText(/Your answers are ready to shape your DNA/)).toBeDefined();
    expect(within(screen.getByRole("region", { name: "Wizard actions" })).getByRole("button", { name: /Save & Generate DNA/ }).hasAttribute("disabled")).toBe(false);
  });
});
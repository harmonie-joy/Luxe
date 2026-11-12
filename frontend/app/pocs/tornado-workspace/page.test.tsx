import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import TornadoWorkspacePage from "./page";

describe("Tornado workspace prototype", () => {
  it("shows the transition, synthetic metrics, and a working local focus checklist", () => {
    render(<TornadoWorkspacePage />);

    expect(screen.getByRole("heading", { name: "The Tornado" })).toBeDefined();
    expect(screen.getByRole("img", { name: /assets being organized into collections/ })).toBeDefined();
    expect(screen.getByText("Preview / synthetic data")).toBeDefined();
    expect(screen.getByText("Illustrative workspace only. No external accounts are connected.")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Today's Focus" })).toBeDefined();

    const metrics = screen.getByRole("region", { name: "Workspace metrics" });
    expect(within(metrics).getByText("1,248")).toBeDefined();
    expect(within(metrics).getByText("92")).toBeDefined();

    const reviewTask = screen.getByRole("checkbox", { name: /Review new brand references/ });
    fireEvent.click(reviewTask);
    expect((reviewTask as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("1/3 done")).toBeDefined();
  });

  it("inherits the sandbox light and dark themes", () => {
    const { container } = render(<SandboxLayout><TornadoWorkspacePage /></SandboxLayout>);
    expect(container.firstElementChild?.classList.contains("dark")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(container.firstElementChild?.classList.contains("dark")).toBe(true);
  });

  it("continues to the Content Workspace", () => {
    render(<TornadoWorkspacePage />);

    fireEvent.click(screen.getByRole("button", { name: /Open Content Workspace/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/content-workspace");
  });
});
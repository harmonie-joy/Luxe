import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SandboxLayout from "./layout";
import ComponentGallery from "./components/page";

describe("design system sandbox", () => {
  it("switches themes locally without changing document theme classes", () => {
    const rootClass = document.documentElement.className;
    const bodyClass = document.body.className;
    const { container } = render(<SandboxLayout><ComponentGallery /></SandboxLayout>);
    const sandbox = container.firstElementChild;
    const toggle = screen.getByRole("button", { name: "Dark mode" });

    expect(sandbox?.classList.contains("dark")).toBe(false);
    expect(toggle.textContent).toContain("Light");
    fireEvent.click(toggle);
    expect(sandbox?.classList.contains("dark")).toBe(true);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.textContent).toContain("Dark");
    fireEvent.click(toggle);
    expect(sandbox?.classList.contains("dark")).toBe(false);
    expect(document.documentElement.className).toBe(rootClass);
    expect(document.body.className).toBe(bodyClass);
    expect(screen.getByRole("link", { name: "Components" }).getAttribute("href")).toBe("/pocs/components");
  });

  it("renders all primitive families and supports input, button and tab interaction", () => {
    render(<SandboxLayout><ComponentGallery /></SandboxLayout>);
    for (const name of ["Buttons", "Inputs", "Cards", "Badges", "Tables", "Tabs"]) {
      expect(screen.getByRole("region", { name })).toBeDefined();
    }
    const buttons = within(screen.getByRole("region", { name: "Buttons" }));
    expect(buttons.getAllByRole("button")).toHaveLength(45);
    fireEvent.click(buttons.getAllByRole("button", { name: "Default" })[0]);
    expect(screen.getByText("Button activations: 1")).toBeDefined();
    const input = screen.getByRole("textbox", { name: "Default" });
    fireEvent.change(input, { target: { value: "New project" } });
    expect((input as HTMLInputElement).value).toBe("New project");
    expect((screen.getByRole("textbox", { name: "Disabled" }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByRole("textbox", { name: "Invalid" }).getAttribute("aria-invalid")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: "Approved" }));
    expect(screen.getByRole("tabpanel").textContent).toContain("No approved content yet.");
    fireEvent.keyDown(screen.getByRole("tab", { name: "Approved" }), { key: "End" });
    expect(screen.getByRole("tab", { name: "Approved" }).getAttribute("aria-selected")).toBe("true");
    expect((screen.getByRole("tab", { name: "Scheduled" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
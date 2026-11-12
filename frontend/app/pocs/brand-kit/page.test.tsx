import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import BrandKitPage from "./page";

describe("Brand Kit wizard step", () => {
  it("offers Back and Continue actions in the step footer", () => {
    render(<SandboxLayout><BrandKitPage /></SandboxLayout>);

    expect(screen.getByRole("heading", { name: "Your Brand Guide" })).toBeDefined();
    const footer = within(screen.getByRole("region", { name: "Wizard actions" }));
    fireEvent.click(footer.getByRole("button", { name: "Continue" }));
    expect(router.push).toHaveBeenCalledWith("/pocs/brand-asset-kit");
    fireEvent.click(footer.getByRole("button", { name: /Back/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/creator-dna");
  });
});
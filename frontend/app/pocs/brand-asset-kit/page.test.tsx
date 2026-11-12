import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import BrandAssetKitPage from "./page";

describe("Brand Asset Kit wizard step", () => {
  it("states that files are not stored and proceeds to Stage 2", () => {
    render(<SandboxLayout><BrandAssetKitPage /></SandboxLayout>);

    expect(screen.getByText(/not connected to storage/)).toBeDefined();
    const footer = within(screen.getByRole("region", { name: "Wizard actions" }));
    fireEvent.click(footer.getByRole("button", { name: "Continue" }));
    expect(router.push).toHaveBeenCalledWith("/pocs/import-world");
    fireEvent.click(footer.getByRole("button", { name: /Back/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/brand-kit");
  });
});
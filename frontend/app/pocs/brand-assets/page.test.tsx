import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SandboxLayout from "../layout";
import BrandAssetsPage from "./page";

describe("Brand Asset Kit", () => {
  it("filters assets by category and opens an asset preview", () => {
    render(<SandboxLayout><BrandAssetsPage /></SandboxLayout>);

    expect(screen.getByRole("progressbar", { name: /storage used/i })).toBeDefined();
    expect(screen.getByRole("button", { name: "Primary Logo" })).toBeDefined();

    fireEvent.click(screen.getByRole("tab", { name: /^Fonts/ }));
    expect(screen.getByRole("button", { name: "Sora SemiBold" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Primary Logo" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Sora SemiBold" }));
    const preview = within(screen.getByRole("complementary", { name: "Asset preview" }));
    expect(preview.getByRole("heading", { name: "Sora SemiBold" })).toBeDefined();
    fireEvent.click(preview.getByRole("button", { name: "Close preview" }));
    expect(screen.queryByRole("complementary", { name: "Asset preview" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "List view" }));
    expect(screen.getByRole("table", { name: "Asset list" })).toBeDefined();
  });

  it("queues dropped files in this preview without claiming persistence", () => {
    render(<SandboxLayout><BrandAssetsPage /></SandboxLayout>);
    const file = new File(["sample"], "campaign-mark.svg", { type: "image/svg+xml" });
    const dropZone = screen.getByRole("region", { name: "Upload assets" });

    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    expect(screen.getByText("campaign-mark.svg")).toBeDefined();
    expect(screen.getByText(/queued in this preview only/i)).toBeDefined();
  });
});
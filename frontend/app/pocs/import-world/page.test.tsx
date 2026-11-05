import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ImportWorldPreviewPage from "./page";

describe("Import My World preview", () => {
  it("clearly identifies the Stage 2 entry as unavailable in this prototype", () => {
    render(<ImportWorldPreviewPage />);

    expect(screen.getByRole("heading", { name: "Import My World" })).toBeDefined();
    expect(screen.getByText(/No accounts, files, or creator data are imported or stored here/)).toBeDefined();
  });
});
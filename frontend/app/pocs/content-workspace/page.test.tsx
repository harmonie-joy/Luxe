import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import ContentWorkspacePage from "./page";

describe("Content Workspace prototype", () => {
  it("renders the three entry paths and cycles the saved-work preview", () => {
    render(<SandboxLayout><ContentWorkspacePage /></SandboxLayout>);

    for (const title of ["Create With Me", "Quick Draft", "Bring Something In"]) {
      expect(screen.getByRole("heading", { name: title })).toBeDefined();
    }
    const savedItems = screen.getByRole("list", { name: "Saved work preview" });
    expect(within(savedItems).getAllByRole("listitem")).toHaveLength(3);
    expect(within(savedItems).getByRole("heading", { name: "Founder story: finding a steadier pace" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Show next saved items" }));
    expect(within(savedItems).getByRole("heading", { name: "Leadership is a daily practice" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Explore quick draft" }));
    expect(screen.getByText(/Quick Draft is a visual preview/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Open Single-Post Preview/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/single-post");
  });

  it("keeps idea and voice previews local and supports both sandbox themes", () => {
    const { container } = render(<SandboxLayout><ContentWorkspacePage /></SandboxLayout>);
    const idea = screen.getByRole("textbox", { name: "Idea note" });
    fireEvent.change(idea, { target: { value: "A note for next week's post" } });
    expect(screen.getByText("Draft note held in this page only.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Voice preview" }));
    expect(screen.getByText("Voice preview selected. Microphone and audio are not used.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(container.firstElementChild?.classList.contains("dark")).toBe(true);
  });
});
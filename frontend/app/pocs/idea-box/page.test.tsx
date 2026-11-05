import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import IdeaBoxPage from "./page";

describe("Idea Box preview", () => {
  it("captures a categorized idea locally", () => {
    render(<IdeaBoxPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "Capture an idea" }), {
      target: { value: "A quiet morning routine series" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Idea category" }), {
      target: { value: "Content" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));

    expect(screen.getByRole("article", { name: "A quiet morning routine series" })).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("Not saved");
  });

  it("searches ideas, moves one into the pipeline, and opens its storyboard", () => {
    render(<IdeaBoxPage />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search ideas" }), {
      target: { value: "repurpose" },
    });
    expect(screen.getByRole("article", { name: "Turn one client question into three posts" })).toBeDefined();
    expect(screen.queryByRole("article", { name: "A more honest launch story" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Move Turn one client question into three posts to pipeline" }));
    expect(screen.getByRole("region", { name: "In motion" }).textContent).toContain("Turn one client question into three posts");

    fireEvent.click(screen.getByRole("button", { name: "Open storyboard for Turn one client question into three posts" }));
    expect(screen.getByRole("dialog", { name: "Turn one client question into three posts storyboard" })).toBeDefined();
    expect(screen.getByText("The question I hear most")).toBeDefined();
  });

  it("moves an idea into the pipeline when it is dropped there", () => {
    render(<IdeaBoxPage />);

    const idea = screen.getByRole("article", { name: "A more honest launch story" });
    const dataTransfer = {
      effectAllowed: "",
      getData: () => "idea-001",
      setData: () => undefined,
    };
    fireEvent.dragStart(idea, { dataTransfer });
    fireEvent.drop(screen.getByRole("region", { name: "In motion" }), { dataTransfer });

    expect(screen.getByRole("region", { name: "In motion" }).textContent).toContain("A more honest launch story");
  });

  it("keeps text capture available when browser speech recognition is unavailable", () => {
    render(<IdeaBoxPage />);

    fireEvent.click(screen.getByRole("button", { name: "Voice note" }));

    expect(screen.getByRole("status").textContent).toContain("Voice transcription is not supported here");
    expect(screen.getByRole("textbox", { name: "Capture an idea" }).hasAttribute("disabled")).toBe(false);
  });
});
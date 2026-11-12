import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import PostsGalleryPage from "./page";

describe("Posts Gallery preview", () => {
  beforeEach(() => { localStorage.clear(); });
  it("shows the content library and returns to the single-post workspace", () => {
    render(<PostsGalleryPage />);

    expect(screen.getByRole("region", { name: "Post gallery" }).children).toHaveLength(8);
    expect(screen.getByText(/No post, media, or publishing action is saved/)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/single-post");
  });

  it("filters every stage, combines search, and clears empty results", () => {
    render(<PostsGalleryPage />);
    for (const [stage, count] of [["Ideas", 1], ["In Progress", 1], ["Review", 1], ["Ready", 1], ["Scheduled", 1], ["Published", 3], ["All", 8]] as const) {
      fireEvent.click(screen.getByRole("button", { name: stage }));
      expect(screen.getByRole("region", { name: "Post gallery" }).children).toHaveLength(count);
      expect(screen.getByRole("button", { name: stage }).getAttribute("aria-pressed")).toBe("true");
    }
    fireEvent.change(screen.getByRole("searchbox", { name: "Search posts" }), { target: { value: "rituals" } });
    expect(screen.getByRole("region", { name: "Post gallery" }).children).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Published" }));
    expect(screen.getByText("No posts found")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("region", { name: "Post gallery" }).children).toHaveLength(8);
  });

  it("sorts posts and repurposes into a local idea without changing the source", () => {
    render(<PostsGalleryPage />);
    fireEvent.change(screen.getByRole("combobox", { name: "Sort posts" }), { target: { value: "title" } });
    expect(screen.getByRole("region", { name: "Post gallery" }).firstElementChild?.getAttribute("aria-label")).toBe("A More Intentional Week");
    fireEvent.change(screen.getByRole("combobox", { name: "Repurpose Weekend Reminder" }), { target: { value: "linkedin" } });
    expect(screen.getByRole("region", { name: "Post gallery" }).children).toHaveLength(2);
    expect(screen.getByRole("status").textContent).toContain("Original unchanged. Not saved.");
    fireEvent.click(screen.getByRole("button", { name: "Published" }));
    expect(screen.getByRole("region", { name: "Post gallery" }).children).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Weekend Reminder" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "New Post" }));
    expect(router.push).toHaveBeenCalledWith("/pocs/content-workspace");
  });
});
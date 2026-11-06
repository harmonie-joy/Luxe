import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PostsGallery } from "../components/posts-gallery";
import { mockSinglePostLoop } from "@/lib/mock-data/pocs-data";
import { createPocPostState, pocPostSignature, pocVisualSignature, POC_POST_CHECKS, savePocPostState } from "@/lib/state/poc-post-state";

describe("Gallery saved package", () => {
  beforeEach(() => { localStorage.clear(); });

  it("does not inflate an empty collection until the fixed post is actually saved", () => {
    render(<PostsGallery initialPosts={[]} />);
    expect(screen.getByRole("region", { name: "Post gallery" }).children).toHaveLength(0);
    const post = createPocPostState();
    post.headline = "Saved working cover";
    post.template = "Minimal";
    post.format = "portrait";
    post.workingCaption = "Working caption not accepted yet";
    act(() => { expect(savePocPostState(post)).toBe(true); });
    const gallery = screen.getByRole("region", { name: "Post gallery" });
    expect(gallery.children).toHaveLength(1);
    expect(within(gallery).getByText("Saved in this browser")).toBeDefined();
    expect(within(gallery).getByText("Saved working cover")).toBeDefined();
    expect(within(gallery).getByText("Working caption not accepted yet")).toBeDefined();
    expect(screen.getByRole("link", { name: "Resume saved post" }).getAttribute("href")).toBe("/pocs/single-post");
    expect(screen.getByRole("group", { name: "Saved original and working visual" }).querySelector('[data-template="Minimal"][data-format="portrait"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "In Progress" }));
    expect(gallery.children).toHaveLength(1);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search posts" }), { target: { value: "minimal" } });
    expect(gallery.children).toHaveLength(1);
  });

  it("filters accepted, ready and scheduled packages and preserves saved identity after repurpose", () => {
    const post = createPocPostState();
    post.caption = post.versions[1].text;
    post.acceptedVersion = post.versions[1].id;
    expect(savePocPostState(post)).toBe(true);
    render(<PostsGallery initialPosts={[]} />);
    const gallery = screen.getByRole("region", { name: "Post gallery" });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(gallery.children).toHaveLength(1);
    post.visualApproved = true;
    post.visualApproval = pocVisualSignature(post);
    post.checks = [...POC_POST_CHECKS];
    post.approved = true;
    post.approvedPackage = pocPostSignature(post);
    act(() => { expect(savePocPostState(post)).toBe(true); });
    expect(gallery.children).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Ready" }));
    expect(gallery.children).toHaveLength(1);
    post.schedule = { date: "2099-06-21", time: "23:15", timezone: "America/New_York" };
    act(() => { expect(savePocPostState(post)).toBe(true); });
    fireEvent.click(screen.getByRole("button", { name: "Scheduled" }));
    expect(gallery.children).toHaveLength(1);
    expect(within(gallery).getByText(/2099-06-21.*23:15.*America\/New_York/)).toBeDefined();
    fireEvent.change(screen.getByRole("combobox", { name: `Repurpose ${mockSinglePostLoop.title}` }), { target: { value: "linkedin" } });
    expect(within(gallery).queryByRole("link", { name: "Resume saved post" })).toBeNull();
    expect(within(gallery).getByText("Synthetic fixture · not saved")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Scheduled" }));
    expect(within(gallery).getByRole("link", { name: "Resume saved post" })).toBeDefined();
  });
});
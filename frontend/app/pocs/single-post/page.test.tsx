import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import SinglePostPage from "./page";

function tab(name: string) { fireEvent.click(screen.getByRole("tab", { name })); }
function approve() {
  tab("10b Caption / Text");
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  tab("10c Visual / Assets");
  fireEvent.click(screen.getByRole("button", { name: "Accept Visual" }));
  tab("10d Final Review");
  for (const name of ["Brand match", "Platform format", "Asset rights"]) fireEvent.click(screen.getByRole("checkbox", { name }));
  fireEvent.click(screen.getByRole("button", { name: /Approve & Mark Ready/ }));
}

describe("Single-post creation loop", () => {
  beforeEach(() => localStorage.clear());

  it("preserves originals and caption history across editing, rejection, acceptance, and browser recovery", async () => {
    const { unmount } = render(<SinglePostPage />);
    await waitFor(() => expect((screen.getByRole("button", { name: "Save Draft" }) as HTMLButtonElement).disabled).toBe(false));
    tab("10b Caption / Text");
    const original = (screen.getByRole("textbox", { name: "Original caption" }) as HTMLTextAreaElement).value;
    fireEvent.click(screen.getByRole("button", { name: "V2" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Suggested caption" }), { target: { value: "My refined message." } });
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(screen.getByRole("button", { name: "V4" })).toBeDefined();
    expect((screen.getByRole("textbox", { name: "Original caption" }) as HTMLTextAreaElement).value).toBe(original);
    fireEvent.click(screen.getByRole("button", { name: "V1" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect((screen.getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("My refined message.");
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
    unmount();
    render(<SinglePostPage />);
    expect(await screen.findByText("My refined message.")).toBeDefined();
  });

  it("gates approval, schedules locally, opens the preview calendar, and invalidates readiness after an edit", () => {
    render(<SinglePostPage />);
    tab("10d Final Review");
    expect((screen.getByRole("button", { name: /Approve & Mark Ready/ }) as HTMLButtonElement).disabled).toBe(true);
    approve();
    expect(screen.getByRole("heading", { name: "Your post is ready." })).toBeDefined();
    fireEvent.change(screen.getByLabelText("Schedule date"), { target: { value: "2099-11-12" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule Post" }));
    fireEvent.click(screen.getByRole("button", { name: "View in Calendar" }));
    expect(screen.getByRole("region", { name: "Preview calendar" })).toBeDefined();
    tab("10c Visual / Assets");
    fireEvent.change(screen.getByRole("textbox", { name: "Cover headline" }), { target: { value: "A new direction" } });
    tab("10e Ready / Schedule");
    expect(screen.getByRole("heading", { name: "Your post needs approval." })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Schedule Post" })).toBeNull();
  });

  it("changes carousel format and slides and supports both sandbox themes", () => {
    const { container } = render(<SandboxLayout><SinglePostPage /></SandboxLayout>);
    tab("10d Final Review");
    fireEvent.change(screen.getByRole("combobox", { name: "Preview aspect ratio" }), { target: { value: "portrait" } });
    expect(screen.getByText("1080 × 1920")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Slide 2" }));
    expect(screen.getByRole("img", { name: "Open mountain horizon" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(container.firstElementChild?.classList.contains("dark")).toBe(true);
  });

  it("continues from the single-post workspace to Posts Gallery", () => {
    render(<SinglePostPage />);

    fireEvent.click(screen.getByRole("button", { name: /Open Posts Gallery/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/posts-gallery");
  });
});
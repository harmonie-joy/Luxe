import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SandboxLayout from "../layout";
import WebPortalPage from "./page";

describe("Web Content Portal prototype", () => {
  it("selects a site page and renders edits safely in a sandboxed live preview", () => {
    render(<WebPortalPage />);
    fireEvent.click(screen.getByRole("button", { name: "Select Services page" }));
    const preview = screen.getByTitle("Services website preview");
    expect(preview.getAttribute("sandbox")).toBe("");
    expect(preview.getAttribute("srcdoc")).toContain("Make room for what comes next.");
    fireEvent.click(screen.getByRole("tab", { name: "Content & SEO" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Headline" }), { target: { value: '<script>alert("hello")</script>' } });
    expect(screen.getByText("Unsaved changes")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save local draft" }));
    expect(screen.getByRole("status").textContent).toContain("saved locally as a draft. No website was published.");
    fireEvent.click(screen.getByRole("tab", { name: "Live Preview" }));
    expect(screen.getByTitle("Services website preview").getAttribute("srcdoc")).toContain("&lt;script&gt;");
    expect(screen.getByTitle("Services website preview").getAttribute("srcdoc")).not.toContain("<script>");
  });

  it("filters pages, handles empty results, and updates SEO for the selected page", () => {
    render(<WebPortalPage />);
    fireEvent.change(screen.getByRole("combobox", { name: "Filter page status" }), { target: { value: "draft" } });
    const pages = within(screen.getByRole("navigation", { name: "Website pages" }));
    expect(pages.getAllByRole("button")).toHaveLength(1);
    fireEvent.click(pages.getByRole("button", { name: "Select Blog page" }));
    expect(screen.getByRole("progressbar", { name: "SEO health score" }).getAttribute("value")).toBe("50");
    fireEvent.click(screen.getByRole("button", { name: "Review SEO" }));
    fireEvent.change(screen.getByRole("textbox", { name: "SEO title" }), { target: { value: "Studio journal | THE LUXE STUDIO" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Meta description" }), { target: { value: "Thoughtful notes on design, creative practice, and building a meaningful brand from the team at THE LUXE STUDIO." } });
    expect(screen.getByRole("progressbar", { name: "SEO health score" }).getAttribute("value")).toBe("100");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search pages" }), { target: { value: "not-a-page" } });
    expect(screen.getByText("No pages match your search and filter.")).toBeDefined();
  });

  it("validates new pages and retains edits when switching pages", () => {
    render(<WebPortalPage />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search pages" }), { target: { value: "About" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Filter page status" }), { target: { value: "published" } });
    fireEvent.click(screen.getByRole("button", { name: "New page" }));
    const name = screen.getByRole("textbox", { name: "Page name" });
    fireEvent.change(name, { target: { value: "About" } });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    expect(screen.getByRole("alert").textContent).toContain("already exists");
    fireEvent.change(name, { target: { value: "!!!" } });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    expect(screen.getByRole("alert").textContent).toContain("letters or numbers");
    fireEvent.change(name, { target: { value: "Our Process" } });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    expect(screen.getByRole("button", { name: "Select Our Process page" }).getAttribute("aria-current")).toBe("page");
    expect((screen.getByRole("searchbox", { name: "Search pages" }) as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("combobox", { name: "Filter page status" }) as HTMLSelectElement).value).toBe("all");
    fireEvent.change(screen.getByRole("textbox", { name: "Headline" }), { target: { value: "Design starts with listening." } });
    fireEvent.click(screen.getByRole("button", { name: "Select Home page" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Our Process page" }));
    expect((screen.getByRole("textbox", { name: "Headline" }) as HTMLInputElement).value).toBe("Design starts with listening.");
    expect(screen.getByText("Unsaved changes")).toBeDefined();
  });

  it("links from the playground, switches devices and sample metrics, and toggles both themes", () => {
    const { container } = render(<SandboxLayout><WebPortalPage /></SandboxLayout>);
    expect(screen.getByRole("link", { name: "Web Content Portal" }).getAttribute("href")).toBe("/pocs/web-portal");
    fireEvent.click(screen.getByRole("tab", { name: "Mobile" }));
    expect(screen.getByTitle("Home website preview").parentElement?.getAttribute("data-device")).toBe("mobile");
    fireEvent.change(screen.getByRole("combobox", { name: "Performance period" }), { target: { value: "7" } });
    expect(screen.getByText("2.1K")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(container.firstElementChild?.classList.contains("dark")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(container.firstElementChild?.classList.contains("dark")).toBe(false);
  });
});
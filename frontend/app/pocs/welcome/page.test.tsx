import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SandboxLayout from "../layout";
import WelcomePage from "./page";

describe("Welcome / Home prototype", () => {
  it("offers an invitation without a form and lets the creator choose a direction", () => {
    render(<SandboxLayout><WelcomePage /></SandboxLayout>);

    expect(screen.getByRole("heading", { name: "THE LUXE" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Login" })).toBeDefined();
    expect(screen.queryByText("Your creative workspace", { exact: true })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByRole("region", { name: /AI-powered|Everything organized|Built for creators|Your data stays private/i })).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Get Started" }));
    expect(screen.getByText("Are you ready to build your content journey?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Scale" }));
    expect(screen.getByText("Bring more intention to the work you share.")).toBeDefined();

    expect(screen.getByRole("link", { name: /Explore the Space/ }).getAttribute("href")).toBe("#welcome-features");
  });
});
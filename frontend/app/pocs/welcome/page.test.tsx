import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import WelcomePage from "./page";

describe("Welcome / Home prototype", () => {
  it("starts the onboarding flow from both primary actions", () => {
    render(<SandboxLayout><WelcomePage /></SandboxLayout>);

    expect(screen.getByRole("heading", { name: "THE LUXE" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Login" })).toBeDefined();
    expect(screen.queryByText("Your creative workspace", { exact: true })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByRole("region", { name: /AI-powered|Everything organized|Built for creators|Your data stays private/i })).toHaveLength(4);

    fireEvent.click(within(screen.getByRole("region", { name: "Wizard actions" })).getByRole("button", { name: /Get Started/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/discover-me");
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(router.push).toHaveBeenCalledWith("/");

    expect(screen.getByRole("link", { name: /Explore the Space/ }).getAttribute("href")).toBe("#welcome-features");
  });
});
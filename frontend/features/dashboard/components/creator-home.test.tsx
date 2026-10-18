import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";

import { CreatorHome } from "@/features/dashboard/components/creator-home";

it("offers honest planned entry points without synthetic progress or write actions", () => {
  render(<CreatorHome />);

  expect(screen.getByRole("heading", { name: "What are we creating today?" })).toBeTruthy();
  for (const name of ["Create With Me", "Quick Draft", "Bring Something In"]) {
    expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(true);
  }
  const resume = screen.getByRole("region", { name: "Continue where you left off" });
  expect(within(resume).getByText("Your next idea deserves a place to land.")).toBeTruthy();
  expect(within(resume).getByText(/Saved-post resume is coming next/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /resume|upload|save/i })).toBeNull();
  expect(screen.getByRole("link", { name: /Open Brand Voice/ }).getAttribute("href")).toBe("/brand-voice");
});

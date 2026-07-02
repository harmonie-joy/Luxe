import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/login",
  "/signup",
  "/dashboard",
  "/brand-voice",
  "/create",
  "/drafts",
  "/compliance",
  "/calendar",
  "/account",
] as const;

// App-shell routes render inside the (app) layout with the sidebar nav.
const NAV_ROUTES = new Set([
  "/dashboard",
  "/brand-voice",
  "/create",
  "/drafts",
  "/compliance",
  "/calendar",
  "/account",
]);

// ponytail: backend-off network noise is expected in smoke; real page errors still fail
const IGNORED_CONSOLE_PATTERNS = [
  "Failed to load resource",
  "ERR_CONNECTION",
  "fetch failed",
];

for (const route of ROUTES) {
  test(`renders ${route}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (IGNORED_CONSOLE_PATTERNS.some((pattern) => text.includes(pattern))) {
        return;
      }
      consoleErrors.push(text);
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));

    const response = await page.goto(route);

    expect(response?.ok()).toBe(true);
    await expect(page.locator("body")).not.toBeEmpty();
    if (NAV_ROUTES.has(route)) {
      await expect(page.getByRole("navigation").first()).toBeVisible();
    }
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

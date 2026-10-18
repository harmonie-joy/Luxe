import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/login",
  "/signup",
  "/dashboard",
  "/content-items/new",
  "/content-items/00000000-0000-0000-0000-000000000053",
  "/brand-voice",
  "/create",
  "/drafts",
  "/compliance",
  "/calendar",
  "/account",
] as const;

// With no backend, protected routes must stop at the session gate.
const NAV_ROUTES = new Set([
  "/dashboard",
  "/content-items/new",
  "/content-items/00000000-0000-0000-0000-000000000053",
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

    // Isolate the backend-off check from any developer backend already running.
    await page.route("**/api/**", (request) => request.abort("connectionrefused"));
    const response = await page.goto(route);

    expect(response?.ok()).toBe(true);
    await expect(page.locator("body")).not.toBeEmpty();
    if (NAV_ROUTES.has(route)) {
      await expect(page.getByRole("heading", { name: "Workspace unavailable" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
      await expect(page.getByRole("navigation")).toHaveCount(0);
    }
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

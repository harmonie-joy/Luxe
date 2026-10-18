import { expect, test } from "@playwright/test";

// Synthetic session for visual/navigation QA only; this does not satisfy #54.
const session = {
  user: { id: "qa-user", username: "preview-reviewer", email: "preview@example.com", displayName: "Preview Reviewer" },
  workspaces: [{ id: "1", name: "Synthetic QA workspace", role: "owner" }],
  activeWorkspaceId: "1",
};

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const [red, green, blue] = color.match(/[\d.]+/g)!.slice(0, 3).map((channel) => {
      const value = Number(channel) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me/", (route) => route.fulfill({ json: session }));
  await page.route("**/api/content-items/?workspace=*", (route) => route.fulfill({ json: [] }));
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const [name, width, height] of [
  ["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 390, 844], ["narrow", 320, 844],
] as const) {
  test(`Creator Home at ${name} width has honest actions and no overflow`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("requestfailed", (request) => {
      // Next cancels speculative route prefetches; asset/API failures still fail QA.
      if (request.url().includes("_rsc=") && request.failure()?.errorText === "net::ERR_ABORTED") return;
      errors.push(request.url());
    });
    await page.setViewportSize({ width, height });
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "What are we creating today?" })).toBeVisible();
    for (const action of ["Quick Draft", "Bring Something In"]) {
      await expect(page.getByRole("button", { name: action, exact: true })).toBeDisabled();
    }
    await expect(page.getByRole("link", { name: "Create With Me", exact: true })).toHaveAttribute("href", "/content-items/new");
    await expect(page.getByRole("link", { name: "Open Brand Voice" })).toHaveAttribute("href", "/brand-voice");
    await expect(page.getByText("No saved posts in this workspace yet.", { exact: false })).toBeAttached();
    for (const container of ["html", "main", "header"]) {
      expect(await page.locator(container).first().evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    const screenshot = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path: screenshot, animations: "disabled" });
    await testInfo.attach(`${name} — synthetic session`, { path: screenshot, contentType: "image/png" });
    expect(errors).toEqual([]);
  });
}

test("mobile navigation traps focus, closes with Escape, and follows existing routes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  const navigation = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Close navigation" })).toBeFocused();
  await expect(navigation.getByText("Preview Reviewer", { exact: true })).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(await navigation.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(navigation).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await navigation.getByRole("link", { name: "Brand Voice", exact: true }).click();
  await expect(page).toHaveURL(/\/brand-voice$/);
  await expect(navigation).not.toBeVisible();
  await trigger.click();
  await expect(navigation.getByRole("link", { name: "Brand Voice", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(navigation.getByRole("link", { name: "Profile", exact: true })).toHaveAttribute("href", "/brand-voice/profile");
});

test("keyboard skip link reaches content and existing account/logout remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/auth/logout/", (route) => route.fulfill({ json: { detail: "Logged out" } }));
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "What are we creating today?" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.getByRole("link", { name: "Open account page" }).click();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue("Preview Reviewer");
  const inputColors = await page.getByLabel("Display name", { exact: true }).evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.borderColor, style.backgroundColor];
  });
  expect(contrastRatio(inputColors[0], inputColors[1])).toBeGreaterThanOrEqual(3);
  const dangerColors = await page.getByRole("button", { name: "Log out", exact: true }).evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.color, style.backgroundColor];
  });
  expect(contrastRatio(dangerColors[0], dangerColors[1])).toBeGreaterThanOrEqual(4.5);
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("retains authenticated legacy routes and labels static demonstration screens", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  // Legacy tools may show their existing demo/error states; no live writes here.
  await page.route("**/api/**", (route) => route.request().url().endsWith("/api/auth/me/")
    ? route.fulfill({ json: session }) : route.abort("connectionrefused"));
  for (const route of ["/brand-voice", "/brand-voice/profile", "/brand-voice/analysis", "/brand-voice/samples", "/create", "/drafts", "/calendar", "/compliance", "/onboarding", "/account"]) {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Open account page" })).toBeVisible();
    if (route === "/calendar" || route === "/compliance") {
      await expect(page.getByRole("note")).toContainText("Demonstration");
    }
  }
  expect(pageErrors).toEqual([]);
});

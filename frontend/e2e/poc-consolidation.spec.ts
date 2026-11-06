import { expect, test, type Page } from "@playwright/test";

const routes = ["welcome", "discover-me", "creator-dna", "brand-kit", "brand-asset-kit", "web-portal", "import-world", "tornado", "content-workspace", "single-post", "posts-gallery", "calendar", "plan", "impact", "home"];
const viewports = [{ width: 1440, height: 1000 }, { width: 390, height: 844 }];

async function frameIsUsable(page: Page) {
  await expect(page.locator("h1").first()).toBeVisible();
  await page.locator("main img").evaluateAll((images) => images.forEach((image) => { (image as HTMLImageElement).loading = "eager"; }));
  await expect.poll(() => page.locator("main img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)), { timeout: 15_000 }).toBe(true);
  await page.evaluate(() => Promise.all(document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => {}))));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator(".luxe-pocs-content").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.locator("main img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
}

async function keyboardFocusIsVisible(page: Page) {
  await page.getByRole("link", { name: "Skip to content", exact: true }).focus();
  await page.keyboard.press("Enter");
  for (let index = 0; index < 24; index++) {
    await page.keyboard.press("Tab");
    const obscured = await page.evaluate(() => {
      const active = document.activeElement;
      const main = document.querySelector(".luxe-pocs-main");
      const footer = document.querySelector('[aria-label="Wizard actions"]');
      if (!active || !main?.contains(active) || !footer || footer.contains(active)) return false;
      const box = active.getBoundingClientRect();
      const bar = footer.getBoundingClientRect();
      return box.bottom > bar.top && box.top < bar.bottom;
    });
    expect(obscured, "Keyboard focus must not be hidden by the sticky footer").toBe(false);
  }
}

for (const viewport of viewports) {
  for (const dark of [false, true]) {
    const variant = `${viewport.width}-${dark ? "dark" : "light"}`;

    test(`all 15 logical POC pages render: ${variant}`, async ({ page }, info) => {
      test.setTimeout(180_000);
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const route of routes) {
        const response = await page.goto(`/pocs/${route}`);
        expect(response?.ok(), route).toBe(true);
        const toggle = page.getByRole("button", { name: "Dark mode", exact: true });
        if ((await toggle.getAttribute("aria-pressed")) !== String(dark)) await toggle.click();
        await expect(page.locator(".luxe-pocs")).toHaveClass(dark ? /dark/ : /^luxe-pocs$/);
        await frameIsUsable(page);
        expect(await page.getByRole("navigation", { name: "Creator navigation" }).getByRole("link").allTextContents()).toEqual(["Home", "Plan", "Create", "Calendar", "Impact", "Library", "Brand/DNA"]);
        await page.screenshot({ path: info.outputPath(`${route}-${variant}.png`) });
        if (route === "home") await keyboardFocusIsVisible(page);
      }
      expect(errors).toEqual([]);
    });

    test(`capture, plan, approve, schedule, and learn: ${variant}`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.goto("/pocs/home");
      if (dark) await page.getByRole("button", { name: "Dark mode", exact: true }).click();
      const thought = `Synthetic creator story ${variant}`;
      await page.getByRole("textbox", { name: "Idea note", exact: true }).fill(thought);
      await page.getByRole("button", { name: "Capture idea", exact: true }).click();
      await expect(page.getByText("Idea saved in this browser's Ideas Inbox.", { exact: true })).toBeVisible();
      await page.getByRole("navigation", { name: "Creator navigation" }).getByRole("link", { name: "Plan", exact: true }).click();
      await page.getByRole("button", { name: `Use idea: ${thought}`, exact: true }).click();
      const plan = page.getByRole("form", { name: "Game Plan" });
      for (const decision of ["Help creators find a sustainable pace", "Independent creators", thought]) {
        await plan.getByRole("textbox").fill(decision);
        await plan.getByRole("button", { name: "Continue", exact: true }).click();
      }
      await plan.getByRole("combobox").selectOption({ index: 1 });
      await plan.getByRole("button", { name: "Save Game Plan", exact: true }).click();
      await expect(page).toHaveURL(/\/pocs\/content-workspace$/);
      await expect(page.getByRole("heading", { name: "Help creators find a sustainable pace" })).toBeVisible();
      await page.getByRole("button", { name: "Start guided", exact: false }).click();
      await expect(page).toHaveURL(/\/pocs\/single-post$/);
      await page.getByRole("button", { name: "Edit Message", exact: true }).click();
      let dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Edit Message", exact: true })).toBeFocused();
      await page.getByRole("button", { name: "Edit Message", exact: true }).click();
      dialog = page.getByRole("dialog");
      const baseline = await dialog.getByRole("textbox", { name: "Original caption" }).inputValue();
      await dialog.getByRole("textbox", { name: "Suggested caption" }).fill(thought);
      await dialog.getByRole("button", { name: "Accept", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.getByRole("button", { name: "Edit Visual", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Accept Visual", exact: true }).click();
      await page.getByRole("button", { name: "Review Post", exact: true }).click();
      dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("button", { name: /Approve & Mark Ready/ })).toBeDisabled();
      for (const check of ["Brand match", "Platform format", "Asset rights"]) await dialog.getByRole("checkbox", { name: check, exact: true }).check();
      await dialog.getByRole("button", { name: /Approve & Mark Ready/ }).click();
      await page.getByRole("button", { name: /Continue to Schedule/ }).click();
      dialog = page.getByRole("dialog");
      const date = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
      await dialog.getByLabel("Schedule date", { exact: true }).fill(date);
      await dialog.getByLabel("Schedule time", { exact: true }).fill("10:00");
      await dialog.getByLabel("Schedule timezone", { exact: true }).selectOption("Europe/Berlin");
      await dialog.getByRole("button", { name: "Schedule Post", exact: true }).click();
      await expect(page).toHaveURL(/\/pocs\/calendar$/);
      await expect(page.getByRole("button", { name: "Jump to saved schedule", exact: true })).toBeVisible();
      await page.getByRole("navigation", { name: "Creator navigation" }).getByRole("link", { name: "Library", exact: true }).click();
      await expect(page.getByText(thought, { exact: true }).first()).toBeVisible();
      await expect(page.getByText("Scheduled", { exact: true }).first()).toBeVisible();
      await page.getByRole("navigation", { name: "Creator navigation" }).getByRole("link", { name: "Impact", exact: true }).click();
      await page.getByRole("radio", { name: "Yes", exact: true }).check();
      await page.getByRole("textbox", { name: "What Happened", exact: true }).fill("Two synthetic creator conversations");
      await page.getByRole("textbox", { name: "What We Learned", exact: true }).fill("Keep the scope small and personal");
      await page.getByRole("button", { name: "Save feedback", exact: true }).click();
      await expect(page.getByRole("link", { name: "Create next post", exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole("textbox", { name: "What We Learned", exact: true })).toHaveValue("Keep the scope small and personal");
      await page.goto("/pocs/single-post");
      await expect(page.getByText("Scheduled locally", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Edit Message", exact: true }).click();
      await expect(page.getByRole("dialog").getByRole("textbox", { name: "Original caption" })).toHaveValue(baseline);
      await page.keyboard.press("Escape");
      await frameIsUsable(page);
      await page.screenshot({ path: info.outputPath(`saved-post-${variant}.png`) });
    });
  }
}
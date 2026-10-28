import { expect, test } from "@playwright/test";
import { mockBrandVoiceSetup, mockBrandVoices } from "../data/mock-brand-profiles";

// Synthetic HTTP fixtures exercise presentation only; #54 owns real-backend verification.
const projectId = "b1b26f01-c87e-4e88-9ea8-c08e69c74b94";
const itemId = "af7b2241-fb63-45fa-a713-7f896723c285";
const voiceId = "30889751-eaa2-46da-9898-ed3dd325468f";
const profileId = "ee9a4bb1-8494-44b9-bcaa-ef6cb63f06ad";
const template = { id: "6f010256-acfe-41ae-874e-2f96d833550e", name: "Synthetic LinkedIn structure", channel: "linkedin", version: 3, body: "Synthetic template body" };
const savedAt = "2026-10-18T10:00:00Z";
const session = {
  user: { id: "qa-user", username: "preview-reviewer", email: "preview@example.com", displayName: "Preview Reviewer" },
  workspaces: [{ id: "1", name: "Synthetic QA workspace", role: "owner" }],
  activeWorkspaceId: "1",
};
const project = { id: projectId, workspaceId: 1, name: "Synthetic launch project", createdAt: savedAt, updatedAt: savedAt };
const item = {
  id: itemId, projectId, brandProfileId: profileId, brandVoiceId: voiceId, channel: "linkedin", contentTemplate: { id: template.id, name: template.name, channel: template.channel, version: template.version },
  title: "A thoughtful launch: explaining the craft and decisions behind our next chapter",
  goal: "Introduce the next chapter with a clear, grounded explanation of the work behind it.",
  workflowStage: "drafting", nextAction: "Write an opening that connects the launch to a real customer question.",
  decisions: ["Use a concrete example before introducing the broader purpose.", "Keep the explanation grounded in evidence and leave room for the creator’s own voice."],
  openQuestions: ["Which customer question should open the story?"], revision: 3, createdAt: savedAt, updatedAt: savedAt,
};
const context = {
  item,
  checkpoint: { id: "d41cb902-9b18-431c-a1b4-b4f145558231", revision: 3, goal: item.goal, workflowStage: item.workflowStage, nextAction: item.nextAction, decisions: item.decisions, openQuestions: item.openQuestions, createdAt: savedAt },
  brandVoice: { id: voiceId, version: 2, isApproved: true },
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    const data: Record<string, unknown> = {
      "/api/auth/me/": session,
      "/api/projects/": [project],
      "/api/content-templates/": [template],
      "/api/content-items/": [item],
      [`/api/content-items/${itemId}/context/`]: context,
      "/api/brand-profiles/": [{ ...mockBrandVoiceSetup.profile, id: profileId, workspaceId: "1", name: "Synthetic editorial voice", activeVoiceId: voiceId }],
      "/api/brand-voices/": [{ ...mockBrandVoices[0], id: voiceId, brandProfileId: profileId, version: 2, isActive: true }],
    };
    return url.pathname in data ? route.fulfill({ json: data[url.pathname] }) : route.fulfill({ status: 404, json: { detail: "Unexpected synthetic QA request" } });
  });
});

for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844], ["narrow", 320, 844]] as const) {
  test(`saved Creator workspace at ${name} width`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("requestfailed", (request) => {
      if (request.url().includes("_rsc=") && request.failure()?.errorText === "net::ERR_ABORTED") return;
      errors.push(`${request.url()}: ${request.failure()?.errorText}`);
    });
    await page.setViewportSize({ width, height });
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /Resume/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create With Me", exact: true })).toHaveAttribute("href", "/content-items/new");
    await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); document.querySelector("main")?.scrollTo(0, 0); });
    await page.screenshot({ path: testInfo.outputPath(`creator-home-${name}.png`), animations: "disabled" });
    await page.getByRole("heading", { name: "Continue where you left off", exact: true }).evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: testInfo.outputPath(`creator-resume-${name}.png`), animations: "disabled" });
    await page.getByRole("link", { name: /Resume/ }).click();
    await expect(page).toHaveURL(new RegExp(`/content-items/${itemId}$`));
    await expect(page.getByRole("heading", { name: item.title, exact: true })).toBeVisible();
    await expect(page.getByText(item.nextAction, { exact: true })).toBeVisible();
    for (const container of ["html", "main"]) {
      expect(await page.locator(container).first().evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath(`post-dashboard-${name}.png`), animations: "disabled" });
    await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Content goal", exact: true })).toHaveValue(item.goal);
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector("main")?.scrollTo(0, 0); });
    await page.screenshot({ path: testInfo.outputPath(`checkpoint-editor-${name}.png`), animations: "disabled" });
    if (name === "mobile") {
      await page.getByRole("button", { name: "Save and return", exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath("checkpoint-editor-actions-mobile.png"), animations: "disabled" });
    }
    await page.goto("/content-items/new");
    await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible();
    for (const container of ["html", "main"]) {
      expect(await page.locator(container).first().evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    const fieldHeights = await page.locator("main input, main select, main textarea").evaluateAll((fields) => fields.map((field) => field.getBoundingClientRect().height));
    expect(fieldHeights.length).toBeGreaterThan(0);
    for (const height of fieldHeights) expect(height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: testInfo.outputPath(`create-item-${name}.png`), animations: "disabled" });
    if (name === "mobile") {
      await page.getByRole("button", { name: "Review and accept version 2", exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath("voice-acceptance-mobile.png"), animations: "disabled" });
    }
    expect(errors).toEqual([]);
  });
}

test("explicit acceptance and creation reach the same saved post home", async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route(`**/api/brand-voices/${voiceId}/approve/`, (route) => route.fulfill({ json: { id: "a348a89a-0cbf-4551-9a90-0da711023f4c", voiceId, workspaceId: "1", event: "accepted", approvedById: "qa-user", approvedAt: savedAt } }));
  await page.route("**/api/content-items/", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    payload = route.request().postDataJSON();
    return route.fulfill({ json: context });
  });
  await page.goto("/content-items/new");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill(item.title);
  await page.getByRole("textbox", { name: "Content goal", exact: true }).fill(item.goal);
  await page.getByRole("textbox", { name: "Next action", exact: true }).fill(item.nextAction);
  await page.getByLabel("LinkedIn content template").selectOption(template.id);
  await expect(page.getByRole("button", { name: "Create saved post", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Review and accept version 2", exact: true }).click();
  await page.getByRole("button", { name: "Create saved post", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/content-items/${itemId}$`));
  await expect(page.getByRole("heading", { name: item.title, exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(new RegExp(`/content-items/${itemId}$`));
  expect(payload).toMatchObject({ project: projectId, brand_profile: profileId, brand_voice: voiceId, title: item.title, goal: item.goal, channel: "linkedin", content_template: template.id });
});

test("dirty navigation and conflict reload require deliberate discard", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(`**/api/content-items/${itemId}/checkpoint/`, (route) => route.fulfill({ status: 409, json: { code: "stale_revision", currentRevision: 4 } }));
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /Resume/ }).click();
  await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
  const goal = page.getByRole("textbox", { name: "Content goal", exact: true });
  await goal.fill("Local work that must survive a conflict");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Back to Creator Home", exact: true }).click();
  await expect(goal).toHaveValue("Local work that must survive a conflict");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.goBack();
  await expect(goal).toHaveValue("Local work that must survive a conflict");
  await page.getByRole("button", { name: "Save checkpoint", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(/conflict/i);
  await expect(goal).toHaveValue("Local work that must survive a conflict");
  await page.locator("main").getByRole("alert").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("checkpoint-conflict-mobile.png"), animations: "disabled" });
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Reload saved version", exact: true }).click();
  await expect(goal).toHaveValue("Local work that must survive a conflict");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reload saved version", exact: true }).click();
  await expect(goal).toHaveValue(item.goal);
  await expect(page.getByRole("status")).toContainText("Saved checkpoint 3");
});

test("checkpoint editing remains usable with keyboard and a 200-percent-equivalent desktop viewport", async ({ page }) => {
  // 720 CSS pixels represent the layout space at 200% zoom on a 1440px desktop.
  await page.setViewportSize({ width: 720, height: 450 });
  await page.goto(`/content-items/${itemId}`);
  const edit = page.getByRole("button", { name: "Edit checkpoint", exact: true });
  await edit.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Content goal", exact: true })).toBeFocused();
  for (const container of ["html", "main"]) {
    expect(await page.locator(container).first().evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
});

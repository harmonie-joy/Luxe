import { expect, test, type Page } from "@playwright/test";

type HistoryWindow = Window & { __luxePopstateCount?: number };

async function trackHistoryTraversal(page: Page) {
  await page.addInitScript(() => {
    const trackedWindow = window as HistoryWindow;
    trackedWindow.__luxePopstateCount = 0;
    window.addEventListener("popstate", () => {
      trackedWindow.__luxePopstateCount = (trackedWindow.__luxePopstateCount ?? 0) + 1;
    }, true);
  });
}

async function waitForCanceledTraversalRestore(page: Page, traverse: () => Promise<unknown>) {
  const initialCount = await page.evaluate(() => (window as HistoryWindow).__luxePopstateCount ?? 0);
  await traverse();
  await expect.poll(() => page.evaluate(() => (window as HistoryWindow).__luxePopstateCount ?? 0)).toBe(initialCount + 2);
}

// Synthetic HTTP fixture; #54 separately verifies real backend persistence.
test("Back and Forward protect edits across repeated save and dirty cycles", async ({ page }) => {
  await trackHistoryTraversal(page);
  const item = { id: "navigation-post", projectId: "navigation-project", title: "Navigation checkpoint", goal: "Initial goal", workflowStage: "idea", nextAction: "Write next", decisions: [], openQuestions: [], revision: 1, createdAt: "2026-10-18T10:00:00Z", updatedAt: "2026-10-18T10:00:00Z" };
  let context = { item, checkpoint: { id: "checkpoint-1", revision: 1, createdAt: item.createdAt }, brandVoice: { id: "voice-1", version: 1, isApproved: true } };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me/") return route.fulfill({ json: { user: { id: "qa", username: "qa", email: "qa@example.com", displayName: "QA" }, workspaces: [{ id: "1", name: "QA", role: "owner" }], activeWorkspaceId: "1" } });
    if (path === "/api/projects/") return route.fulfill({ json: [{ id: "navigation-project", workspaceId: 1, name: "Navigation" }] });
    if (path === "/api/content-items/") return route.fulfill({ json: [context.item] });
    if (path.endsWith("/checkpoint/")) {
      const body = route.request().postDataJSON();
      const revision = context.item.revision + 1;
      context = { ...context, item: { ...context.item, goal: body.goal, revision }, checkpoint: { ...context.checkpoint, revision } };
    }
    return route.fulfill({ json: context });
  });
  let dialogs = 0;
  let accept = false;
  page.on("dialog", async (dialog) => { dialogs += 1; if (accept) await dialog.accept(); else await dialog.dismiss(); });
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /Resume/ }).click();
  await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
  const goal = page.getByRole("textbox", { name: "Content goal", exact: true });
  for (const text of ["Saved first", "Saved second"]) {
    await goal.fill(text);
    await page.getByRole("button", { name: "Save checkpoint", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Saved checkpoint");
  }
  await goal.fill("Newest local goal");
  await expect(page.getByRole("status")).toHaveText("Unsaved changes");
  await page.getByRole("link", { name: "Skip to content", exact: true }).evaluate((link) => (link as HTMLAnchorElement).click());
  await page.goBack();
  await expect(goal).toHaveValue("Newest local goal");
  expect(dialogs).toBe(0);
  await waitForCanceledTraversalRestore(page, () => page.goBack());
  await expect(goal).toHaveValue("Newest local goal");
  expect(dialogs).toBe(1);
  accept = true;
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(dialogs).toBe(2);
  await page.goForward();
  await expect(page).toHaveURL(/\/content-items\/navigation-post$/);
  await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
  await expect(goal).toHaveValue("Saved second");
  await goal.fill("Forward restored edit");
  accept = false;
  await waitForCanceledTraversalRestore(page, () => page.goBack());
  await expect(goal).toHaveValue("Forward restored edit");
  expect(dialogs).toBe(3);
  accept = true;
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(dialogs).toBe(4);
  await page.goForward();
  await page.getByRole("link", { name: "Open account page", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goBack();
  await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
  await goal.fill("Guard a forward traversal");
  accept = false;
  await waitForCanceledTraversalRestore(page, () => page.goForward());
  await expect(goal).toHaveValue("Guard a forward traversal");
  expect(dialogs).toBe(5);
  accept = true;
  await page.goForward();
  await expect(page).toHaveURL(/\/account$/);
  expect(dialogs).toBe(6);
});

test("canceling a multi-entry Back jump across a native hash restores the same post and edits", async ({ page }) => {
  await trackHistoryTraversal(page);
  const item = (id: string) => ({ id, projectId: "project-1", title: id, goal: "Saved goal", workflowStage: "idea", nextAction: "Write next", decisions: [], openQuestions: [], revision: 1, updatedAt: "2026-10-18T10:00:00Z" });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me/") return route.fulfill({ json: { user: { id: "qa", username: "qa", email: "qa@example.com", displayName: "QA" }, workspaces: [{ id: "1", name: "QA", role: "owner" }], activeWorkspaceId: "1" } });
    if (path === "/api/projects/") return route.fulfill({ json: [{ id: "project-1", workspaceId: 1, name: "QA" }] });
    if (path === "/api/content-items/") return route.fulfill({ json: [item("post-one"), item("post-two")] });
    const selected = item(path.split("/")[3]);
    return route.fulfill({ json: { item: selected, checkpoint: { id: "checkpoint-1", revision: 1, createdAt: selected.updatedAt }, brandVoice: { id: "voice-1", version: 1, isApproved: true } } });
  });
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Resume post-one", exact: true }).click();
  await expect(page).toHaveURL(/\/content-items\/post-one$/);
  await page.getByRole("heading", { name: "post-one", exact: true }).waitFor();
  await page.getByRole("link", { name: "Skip to content", exact: true }).evaluate((link) => (link as HTMLAnchorElement).click());
  await expect(page).toHaveURL(/post-one#workspace-main$/);
  await page.getByRole("link", { name: "Back to Creator Home", exact: true }).click();
  await page.getByRole("link", { name: "Resume post-two", exact: true }).click();
  await expect(page).toHaveURL(/\/content-items\/post-two$/);
  await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
  const goal = page.getByRole("textbox", { name: "Content goal", exact: true });
  await goal.fill("Newest edits belong to post two");
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => { dialogs.push(dialog.type()); await dialog.dismiss(); });
  await waitForCanceledTraversalRestore(page, () => page.evaluate(() => history.go(-3)));
  await expect.poll(() => dialogs.length).toBeGreaterThan(0);
  await expect(page).toHaveURL(/\/content-items\/post-two$/);
  await expect(page.getByRole("heading", { name: "post-two", exact: true })).toBeVisible();
  await expect(goal).toHaveValue("Newest edits belong to post two");
  expect(dialogs).toEqual(["confirm"]);
});

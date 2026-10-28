import { randomUUID } from "node:crypto";
import { api, createItem, expect, login, post, safeTimeline, screenshot, test } from "./fixtures";

test("foreign workspace cannot list, read, restore, checkpoint or accept another workspace's voice", async ({ page, fixtures, browser }, testInfo) => {
  await login(page, fixtures);
  const created = await createItem(page, fixtures, "Private creator A post");
  const context = await browser.newContext({ baseURL: "http://localhost:3154" });
  const attach = safeTimeline(context, testInfo);
  try {
    const other = await context.newPage();
    await login(other, fixtures, "b");
    await expect(other.getByRole("link", { name: /Resume/ })).toHaveCount(0);
    await expect(other.getByText("No saved posts in this workspace yet. Start with Create With Me.", { exact: true })).toBeVisible();
    const items = await other.request.get(`${api}/api/content-items/?workspace=${fixtures.a.workspaceId}`);
    expect(items.status()).toBe(200);
    expect(await items.json()).toEqual([]);
    const templates = await other.request.get(`${api}/api/content-templates/?workspace=${fixtures.a.workspaceId}`);
    expect(templates.status()).toBe(403);
    for (const suffix of ["", "context/"]) {
      const denied = await other.request.get(`${api}/api/content-items/${created.item.id}/${suffix}`);
      expect(denied.status()).toBe(404);
      expect(await denied.json()).toEqual({ detail: "No ContentItem matches the given query." });
    }
    const checkpoint = await post(other, `/api/content-items/${created.item.id}/checkpoint/`, {
      expected_revision: 1, client_request_id: randomUUID(), goal: "Unauthorized overwrite", workflow_stage: "drafting", next_action: "None", decisions: [], open_questions: [],
    });
    expect(checkpoint.status()).toBe(404);
    const approval = await post(other, `/api/brand-voices/${fixtures.a.voiceId}/approve/`, {});
    expect(approval.status()).toBe(404);
    await other.goto(`/content-items/${created.item.id}`);
    await expect(other.getByRole("heading", { name: "Post unavailable", exact: true })).toBeVisible();
    await expect(other.locator("main").getByRole("alert")).toContainText("not found or is unavailable");
    await expect(other.getByText(created.item.title, { exact: true })).toHaveCount(0);
    await expect(other.getByRole("button", { name: "Edit checkpoint", exact: true })).toHaveCount(0);
    expect(fixtures.read().items).toEqual([expect.objectContaining({ revision: 1, goal: created.item.goal })]);
    expect(fixtures.read().approvals).toEqual([{ voice_id: fixtures.a.voiceId, workspace_id: fixtures.a.workspaceId, approved_by_id: fixtures.a.userId }]);
    await screenshot(other, testInfo, "foreign-post-unavailable");
  } finally { await attach(); await context.close(); }
});

test("a server-rejected stale template preserves the form until the creator reloads and reselects", async ({ page, fixtures }) => {
  await login(page, fixtures);
  const templatesResponse = page.waitForResponse((response) => response.url() === `${api}/api/content-templates/?workspace=${fixtures.a.workspaceId}` && response.request().method() === "GET");
  await page.getByRole("link", { name: "Create With Me", exact: true }).click();
  const listedTemplates = await templatesResponse;
  expect(listedTemplates.status()).toBe(200);
  expect(await listedTemplates.json()).toContainEqual(expect.objectContaining({ id: fixtures.template.id, version: 1 }));
  await page.getByRole("combobox", { name: "LinkedIn content template", exact: true }).selectOption(fixtures.template.id);
  await page.getByRole("textbox", { name: "New project name", exact: true }).fill("Synthetic stale-template project");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Stale selection recovery");
  await page.getByRole("textbox", { name: "Content goal", exact: true }).fill("Keep this creator input intact.");
  await page.getByRole("textbox", { name: "Next action", exact: true }).fill("Choose the current template.");
  await page.getByRole("button", { name: "Review and accept version 2", exact: true }).click();
  await expect(page.getByText("Accepted version 2 for this workspace.", { exact: true })).toBeVisible();

  const replacement = fixtures.advanceTemplate();
  const rejectedRequest = page.waitForResponse((response) => response.url() === `${api}/api/content-items/` && response.request().method() === "POST");
  await page.getByRole("button", { name: "Create saved post", exact: true }).click();
  const rejected = await rejectedRequest;
  expect(rejected.status()).toBe(400);
  expect(await rejected.json()).toHaveProperty("content_template");
  await expect(page.locator("main").getByRole("alert")).toContainText("The selected template is no longer active.");
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue("Stale selection recovery");
  await expect(page.getByRole("textbox", { name: "Content goal", exact: true })).toHaveValue("Keep this creator input intact.");
  await expect(page.getByRole("button", { name: "Create saved post", exact: true })).toBeDisabled();
  expect(fixtures.read().items).toEqual([]);

  const refreshedTemplates = page.waitForResponse((response) => response.url() === `${api}/api/content-templates/?workspace=${fixtures.a.workspaceId}` && response.request().method() === "GET");
  await page.getByRole("button", { name: "Reload templates", exact: true }).click();
  expect(await (await refreshedTemplates).json()).toContainEqual(expect.objectContaining(replacement));
  const templateSelect = page.getByRole("combobox", { name: "LinkedIn content template", exact: true });
  await expect(templateSelect).toHaveValue("");
  await templateSelect.selectOption(replacement.id);

  const createdRequest = page.waitForResponse((response) => response.url() === `${api}/api/content-items/` && response.request().method() === "POST");
  await page.getByRole("button", { name: "Create saved post", exact: true }).click();
  const created = await createdRequest;
  expect(created.status()).toBe(201);
  const body = await created.json();
  expect(body.item.contentTemplate).toMatchObject(replacement);
  expect(fixtures.read().items).toEqual([expect.objectContaining({ content_template_id: replacement.id, content_template__version: replacement.version })]);
});

test("independent sessions expose stale revision and conflicting retry without losing edits or overwriting checkpoints", async ({ page, fixtures, browser }, testInfo) => {
  await login(page, fixtures);
  const created = await createItem(page, fixtures, "Concurrent editorial post");
  const context = await browser.newContext({ baseURL: "http://localhost:3154" });
  const attach = safeTimeline(context, testInfo);
  try {
    const stale = await context.newPage();
    await login(stale, fixtures);
    await stale.getByRole("link", { name: "Resume Concurrent editorial post", exact: true }).click();
    await stale.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
    await stale.getByRole("textbox", { name: "Content goal", exact: true }).fill("Session B unsaved editorial context");
    await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
    await page.getByRole("textbox", { name: "Content goal", exact: true }).fill("Session A committed editorial context");
    let requestPayload: Record<string, unknown> = {};
    page.on("request", (request) => { if (request.url().endsWith(`/content-items/${created.item.id}/checkpoint/`)) requestPayload = request.postDataJSON(); });
    await page.getByRole("button", { name: "Save and return", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Saved checkpoint 2");
    const conflict = stale.waitForResponse((response) => response.url().endsWith(`/content-items/${created.item.id}/checkpoint/`));
    await stale.getByRole("button", { name: "Save checkpoint", exact: true }).click();
    const response = await conflict;
    expect(response.status()).toBe(409);
    expect(await response.json()).toEqual({ code: "stale_revision", currentRevision: 2 });
    await expect(stale.locator("main").getByRole("alert")).toContainText("Revision conflict");
    await expect(stale.getByRole("textbox", { name: "Content goal", exact: true })).toHaveValue("Session B unsaved editorial context");
    await expect(stale.getByRole("button", { name: "Save checkpoint", exact: true })).toBeDisabled();
    expect(fixtures.read().items).toEqual([expect.objectContaining({ goal: "Session A committed editorial context", revision: 2 })]);
    expect(fixtures.read().checkpoints).toHaveLength(2);
    // Actual HTTP retry with the same key and different payload exercises the other documented 409.
    const reused = await post(page, `/api/content-items/${created.item.id}/checkpoint/`, { ...requestPayload, goal: "Changed retry payload" });
    expect(reused.status()).toBe(409);
    expect(await reused.json()).toEqual({ code: "idempotency_key_reused", currentRevision: 2 });
    stale.once("dialog", (dialog) => dialog.dismiss());
    await stale.getByRole("button", { name: "Reload saved version", exact: true }).click();
    await expect(stale.getByRole("textbox", { name: "Content goal", exact: true })).toHaveValue("Session B unsaved editorial context");
    await screenshot(stale, testInfo, "conflict-edits-retained");
    stale.once("dialog", (dialog) => dialog.accept());
    await stale.getByRole("button", { name: "Reload saved version", exact: true }).click();
    await expect(stale.getByRole("textbox", { name: "Content goal", exact: true })).toHaveValue("Session A committed editorial context");
  } finally { await attach(); await context.close(); }
});

test("a real disconnected save retains unsaved fields and retries only after connectivity returns", async ({ page, context, fixtures }, testInfo) => {
  await login(page, fixtures);
  const created = await createItem(page, fixtures, "Connection recovery post");
  await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
  await page.getByRole("textbox", { name: "Content goal", exact: true }).fill("Retain this work during a connection failure");
  await context.setOffline(true);
  try {
    await page.getByRole("button", { name: "Save checkpoint", exact: true }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Save not confirmed. Your edits are preserved.");
    await expect(page.getByRole("status")).toContainText("local edits retained");
    await expect(page.getByRole("textbox", { name: "Content goal", exact: true })).toHaveValue("Retain this work during a connection failure");
    expect(fixtures.read().items).toEqual([expect.objectContaining({ id: created.item.id, revision: 1, goal: created.item.goal })]);
    expect(fixtures.read().checkpoints).toHaveLength(1);
    await screenshot(page, testInfo, "disconnected-save-retained");
  } finally { await context.setOffline(false); }
  await page.getByRole("button", { name: "Save and return", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved checkpoint 2");
  expect(fixtures.read().items).toEqual([expect.objectContaining({ revision: 2, goal: "Retain this work during a connection failure" })]);
  expect(fixtures.read().checkpoints).toHaveLength(2);
});

test("rapid creation submits once; disconnected creation requires deliberate reconciliation before retry", async ({ page, context, fixtures }, testInfo) => {
  await login(page, fixtures);
  let creates = 0;
  page.on("request", (request) => { if (request.url() === `${api}/api/content-items/` && request.method() === "POST") creates++; });
  await createItem(page, fixtures, "One rapid submission", true);
  expect(creates).toBe(1);
  expect(fixtures.read().items).toHaveLength(1);
  // New form: approval already exists, but acceptance remains an explicit UI step.
  await page.getByRole("link", { name: "Back to Creator Home", exact: true }).click();
  await page.getByRole("link", { name: "Create With Me", exact: true }).click();
  await page.getByRole("combobox", { name: "LinkedIn content template", exact: true }).selectOption(fixtures.template.id);
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Disconnected creation retry");
  await page.getByRole("textbox", { name: "Content goal", exact: true }).fill("Preserve this form for a deliberate retry");
  await page.getByRole("textbox", { name: "Next action", exact: true }).fill("Check saved posts first");
  await page.getByRole("button", { name: "Review and accept version 2", exact: true }).click();
  await expect(page.getByText("Accepted version 2 for this workspace.", { exact: true })).toBeVisible();
  await context.setOffline(true);
  try {
    await page.getByRole("button", { name: "Create saved post", exact: true }).click();
    await expect(page.getByText(/The request may have reached the server/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Create saved post", exact: true })).toBeDisabled();
    await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue("Disconnected creation retry");
    expect(fixtures.read().items).toHaveLength(1);
    await screenshot(page, testInfo, "uncertain-creation-reconciliation");
  } finally { await context.setOffline(false); }
  const saved = await page.request.get(`${api}/api/content-items/?workspace=${fixtures.a.workspaceId}`);
  expect((await saved.json()).map((item: { title: string }) => item.title)).toEqual(["One rapid submission"]);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "I checked; allow another attempt", exact: true }).click();
  await expect(page.getByRole("button", { name: "Create saved post", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Create saved post", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Disconnected creation retry", exact: true })).toBeVisible();
  expect(fixtures.read().items).toHaveLength(2);
});

test("Creator Home reports an actual API connection outage without displaying example posts", async ({ page, context, fixtures }, testInfo) => {
  await login(page, fixtures);
  await createItem(page, fixtures, "Real saved post during outage");
  const network = await context.newCDPSession(page);
  await network.send("Network.enable");
  // Browser firewall blocks the actual saved-post connection; Next.js/auth remain live.
  await network.send("Network.setBlockedURLs", { urls: [`${api}/api/content-items/*`] });
  try {
    await page.getByRole("link", { name: "Back to Creator Home", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Continue where you left off", exact: true })).toBeVisible();
    await expect(page.locator("main").getByRole("alert")).toContainText("Saved posts are unavailable. Your saved work has not been replaced with examples.");
    await expect(page.getByRole("link", { name: /Resume/ })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Real saved post during outage", exact: true })).toHaveCount(0);
    await screenshot(page, testInfo, "creator-home-connection-outage");
    expect(fixtures.read().items).toHaveLength(1);
  } finally {
    await network.send("Network.setBlockedURLs", { urls: [] });
    await network.detach();
  }
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("link", { name: "Resume Real saved post during outage", exact: true })).toBeVisible();
});

test("known initial-create limitation: replay after a discarded acknowledgment creates another persisted item", async ({ page, fixtures }, testInfo) => {
  await login(page, fixtures);
  let payload: object = {};
  page.on("request", (request) => { if (request.url() === `${api}/api/content-items/` && request.method() === "POST") payload = request.postDataJSON(); });
  const first = await createItem(page, fixtures, "Ambiguous acknowledgment retry");
  // Replay the real request as a caller would after losing the first acknowledgment.
  const retry = await post(page, "/api/content-items/", payload);
  expect(retry.status()).toBe(201);
  const second = await retry.json();
  expect(second.item.id).not.toBe(first.item.id);
  const state = fixtures.read();
  expect(state.items).toHaveLength(2);
  expect(state.items.map((item) => item.title)).toEqual(["Ambiguous acknowledgment retry", "Ambiguous acknowledgment retry"]);
  await testInfo.attach("known-non-idempotent-create", { body: JSON.stringify({ firstItem: first.item.id, retriedItem: second.item.id, persistedCount: state.items.length, assessment: "Pending-submit guard and explicit reconciliation pass; initial creation has no exactly-once guarantee after an ambiguous acknowledgment." }, null, 2), contentType: "application/json" });
});

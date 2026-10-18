import { api, createItem, expect, login, post, safeTimeline, screenshot, test } from "./fixtures";

test("creator accepts exact voice, creates and saves a post, then restores PostgreSQL context in a fresh session", async ({ page, fixtures, browser }, testInfo) => {
  await login(page, fixtures);
  await expect(page.getByText(fixtures.a.displayName, { exact: true })).toBeVisible();
  await expect(page.locator("aside").getByText(fixtures.a.workspaceName, { exact: true })).toBeVisible();
  await screenshot(page, testInfo, "creator-home-desktop");
  const created = await createItem(page, fixtures, "Evidence-led launch post");
  const id = created.item.id;
  expect(fixtures.read().items).toEqual([expect.objectContaining({ id, project__workspace_id: fixtures.a.workspaceId, brand_voice_id: fixtures.a.voiceId, revision: 1 })]);
  await page.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
  await page.getByRole("textbox", { name: "Content goal", exact: true }).fill("Explain the launch using a concrete customer question.");
  await page.getByRole("combobox", { name: /^Current stage/ }).selectOption("drafting");
  await page.getByRole("textbox", { name: "Previous decisions", exact: true }).fill("Use an evidence-led opening.\nKeep the tone direct.");
  await page.getByRole("textbox", { name: "Open questions", exact: true }).fill("Which customer example has permission?");
  await page.getByRole("textbox", { name: "Next action", exact: true }).fill("Ask the customer for permission.");
  await expect(page.getByRole("status")).toContainText("Unsaved changes");
  const saved = page.waitForResponse((response) => response.url() === `${api}/api/content-items/${id}/checkpoint/`);
  await page.getByRole("button", { name: "Save and return", exact: true }).click();
  const savedResponse = await saved;
  expect(savedResponse.status()).toBe(201);
  const savedContext = await savedResponse.json();
  await expect(page.getByRole("status")).toContainText("Saved checkpoint 2");
  const snapshot = {
    goal: "Explain the launch using a concrete customer question.", workflow_stage: "drafting",
    decisions: ["Use an evidence-led opening.", "Keep the tone direct."],
    open_questions: ["Which customer example has permission?"], next_action: "Ask the customer for permission.",
  };
  const state = fixtures.read();
  expect(state.items).toEqual([expect.objectContaining({ id, ...snapshot, revision: 2 })]);
  expect(state.checkpoints).toEqual([
    expect.objectContaining({ revision: 1, goal: "Explain our evidence-based launch approach." }),
    expect.objectContaining({ ...snapshot, revision: 2, id: savedContext.checkpoint.id }),
  ]);
  await testInfo.attach("postgres-verification", { body: JSON.stringify(state, null, 2), contentType: "application/json" });
  await screenshot(page, testInfo, "post-dashboard-desktop");
  await page.getByRole("link", { name: "Back to Creator Home", exact: true }).click();
  const desktopResume = page.getByRole("link", { name: "Resume Evidence-led launch post", exact: true });
  await desktopResume.scrollIntoViewIfNeeded();
  await screenshot(page, testInfo, "resume-desktop");
  await desktopResume.click();
  await expect(page.getByRole("status")).toContainText("Saved checkpoint 2");
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Saved checkpoint 2");
  await expect(page.getByText(snapshot.goal, { exact: true })).toBeVisible();
  // A later real activation must not silently rebind existing work.
  expect((await post(page, `/api/brand-voices/${fixtures.a.replacementVoiceId}/activate/`, {})).status()).toBe(200);
  await page.getByRole("link", { name: "Open account page", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto(`/content-items/${id}`);
  await expect(page.getByRole("heading", { name: "Sign in to your workspace", exact: true })).toBeVisible();
  expect([401, 403]).toContain((await page.request.get(`${api}/api/content-items/${id}/context/`)).status());
  await expect(page.getByText(snapshot.goal, { exact: true })).toHaveCount(0);
  const fresh = await browser.newContext({ baseURL: "http://localhost:3154", viewport: { width: 390, height: 844 } });
  const attach = safeTimeline(fresh, testInfo);
  try {
    const resumed = await fresh.newPage();
    await login(resumed, fixtures);
    await expect(resumed.getByRole("heading", { name: "Continue where you left off", exact: true })).toBeVisible();
    await screenshot(resumed, testInfo, "creator-home-mobile");
    const resume = resumed.getByRole("link", { name: "Resume Evidence-led launch post", exact: true });
    await expect(resume).toBeVisible();
    await resume.scrollIntoViewIfNeeded();
    await screenshot(resumed, testInfo, "resume-mobile");
    const restoredResponse = resumed.waitForResponse((response) => response.url() === `${api}/api/content-items/${id}/context/`);
    await resume.click();
    expect((await (await restoredResponse).json()).checkpoint).toEqual(savedContext.checkpoint);
    await expect(resumed).toHaveURL(new RegExp(`/content-items/${id}$`));
    await expect(resumed.getByRole("heading", { name: "Evidence-led launch post", exact: true })).toBeVisible();
    await expect(resumed.getByText("Current stage: Drafting · Stored checkpoint 2", { exact: true })).toBeVisible();
    await expect(resumed.getByRole("status")).toContainText("Saved checkpoint 2");
    for (const text of [snapshot.goal, snapshot.next_action, ...snapshot.decisions, ...snapshot.open_questions, "Version 2 · Human approved", `Voice ID: ${fixtures.a.voiceId}`]) {
      await expect(resumed.getByText(text, { exact: true })).toBeVisible();
    }
    for (const selector of ["html", "main"]) expect(await resumed.locator(selector).evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await screenshot(resumed, testInfo, "post-dashboard-mobile");
    await resumed.getByRole("button", { name: "Open navigation", exact: true }).click();
    await expect(resumed.getByRole("dialog", { name: "Workspace navigation", exact: true })).toBeVisible();
    await expect(resumed.getByRole("dialog").getByText(fixtures.a.workspaceName, { exact: true })).toBeVisible();
    await resumed.keyboard.press("Escape");
    await expect(resumed.getByRole("dialog")).not.toBeVisible();
    await resumed.getByRole("button", { name: "Edit checkpoint", exact: true }).click();
    await expect(resumed.getByRole("textbox", { name: "Content goal", exact: true })).toHaveValue(snapshot.goal);
    await expect(resumed.getByRole("combobox", { name: /^Current stage/ })).toHaveValue("drafting");
    await expect(resumed.getByRole("textbox", { name: "Previous decisions", exact: true })).toHaveValue(snapshot.decisions.join("\n"));
    await expect(resumed.getByRole("textbox", { name: "Open questions", exact: true })).toHaveValue(snapshot.open_questions[0]);
    await expect(resumed.getByRole("textbox", { name: "Next action", exact: true })).toHaveValue(snapshot.next_action);
  } finally { await attach(); await fresh.close(); }
});

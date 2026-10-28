import { test as base, expect, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";

export const api = "http://localhost:8154";
interface Creator {
  userId: number; email: string; displayName: string; workspaceId: number;
  workspaceName: string; profileId: string; voiceId: string; replacementVoiceId: string;
}
interface ContentTemplateFixture { id: string; key: string; name: string; channel: "linkedin"; version: number }
interface State {
  postgresVersion: number;
  items: Array<Record<string, unknown>>;
  checkpoints: Array<Record<string, unknown>>;
  approvals: Array<Record<string, unknown>>;
}
export interface Fixtures {
  a: Creator; b: Creator; template: ContentTemplateFixture; password: string;
  read: () => State;
  advanceTemplate: () => Omit<ContentTemplateFixture, "key">;
}

function database(action: string, namespace: string, input = "") {
  const python = process.env.E2E_PYTHON ?? path.resolve("../backend/.venv/bin/python");
  return execFileSync(python, ["e2e-real/db.py", action, namespace], { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

export function safeTimeline(context: BrowserContext, testInfo: TestInfo) {
  const timeline: object[] = [];
  context.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === api) timeline.push({ event: "response", method: response.request().method(), path: url.pathname, status: response.status() });
  });
  context.on("requestfailed", (request) => {
    const url = new URL(request.url());
    if (url.origin === api) timeline.push({ event: "requestfailed", method: request.method(), path: url.pathname, error: request.failure()?.errorText });
  });
  return () => testInfo.attach(`http-timeline-${testInfo.attachments.length}`, { body: JSON.stringify(timeline, null, 2), contentType: "application/json" });
}

export const test = base.extend<{ fixtures: Fixtures }>({
  fixtures: async ({ context, browser }, provide, testInfo) => {
    const namespace = randomUUID();
    const password = randomUUID();
    const data = JSON.parse(database("seed", namespace, password));
    const attach = safeTimeline(context, testInfo);
    await testInfo.attach("browser-engine", { body: `Chromium ${browser.version()}`, contentType: "text/plain" });
    try {
      await provide({
        ...data,
        password,
        read: () => JSON.parse(database("read", namespace)),
        advanceTemplate: () => JSON.parse(database("advance-template", namespace)),
      });
    }
    finally { await attach(); database("cleanup", namespace); }
  },
});
export { expect };

export async function login(page: Page, fixtures: Fixtures, user: "a" | "b" = "a") {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(fixtures[user].email);
  // Avoid assertion errors echoing credentials into failure artifacts.
  await page.getByLabel("Password", { exact: true }).evaluate((input, password) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, password);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, fixtures.password);
  await page.getByRole("button", { name: "Enter dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /What are we creating today/ })).toBeVisible();
}

export async function post(page: Page, endpoint: string, data: object) {
  const csrf = (await page.context().cookies(api)).find((cookie) => cookie.name === "csrftoken");
  return page.request.post(`${api}${endpoint}`, { data, headers: { "X-CSRFToken": csrf?.value ?? "", Origin: "http://localhost:3154" } });
}

export async function prepareCreation(page: Page, fixtures: Fixtures, title: string) {
  const templatesResponse = page.waitForResponse((response) => response.url() === `${api}/api/content-templates/?workspace=${fixtures.a.workspaceId}` && response.request().method() === "GET");
  await page.getByRole("link", { name: "Create With Me", exact: true }).click();
  const templates = await templatesResponse;
  expect(templates.status()).toBe(200);
  expect(await templates.json()).toContainEqual(expect.objectContaining({
    id: fixtures.template.id,
    name: fixtures.template.name,
    channel: fixtures.template.channel,
    version: fixtures.template.version,
  }));
  await page.getByRole("combobox", { name: "LinkedIn content template", exact: true }).selectOption(fixtures.template.id);
  await page.getByRole("textbox", { name: "New project name", exact: true }).fill("Synthetic editorial project");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill(title);
  await page.getByRole("textbox", { name: "Content goal", exact: true }).fill("Explain our evidence-based launch approach.");
  await page.getByRole("textbox", { name: "Next action", exact: true }).fill("Write the opening question.");
  await expect(page.getByRole("button", { name: "Create saved post", exact: true })).toBeDisabled();
  expect(fixtures.read().approvals).toEqual([]);
  await page.getByText("Review this exact voice version", { exact: true }).click();
  await expect(page.getByText(`Voice ID: ${fixtures.a.voiceId}`, { exact: true })).toBeVisible();
  const approval = page.waitForResponse((response) => response.url() === `${api}/api/brand-voices/${fixtures.a.voiceId}/approve/` && response.request().method() === "POST");
  await page.getByRole("button", { name: "Review and accept version 2", exact: true }).click();
  expect((await approval).status()).toBe(201);
  expect(fixtures.read().approvals).toEqual([{ voice_id: fixtures.a.voiceId, workspace_id: fixtures.a.workspaceId, approved_by_id: fixtures.a.userId }]);
  await expect(page.getByText("Accepted version 2 for this workspace.", { exact: true })).toBeVisible();
}

export async function createItem(page: Page, fixtures: Fixtures, title: string, rapidSubmit = false) {
  await prepareCreation(page, fixtures, title);
  const created = page.waitForResponse((response) => response.url() === `${api}/api/content-items/` && response.request().method() === "POST");
  if (rapidSubmit) {
    // Same-tick repeated DOM submissions exercise the guard while real HTTP remains pending.
    await page.locator("form").evaluate((form) => { for (let n = 0; n < 5; n++) (form as HTMLFormElement).requestSubmit(); });
  } else await page.getByRole("button", { name: "Create saved post", exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const body = await response.json();
  await expect(page).toHaveURL(new RegExp(`/content-items/${body.item.id}$`));
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  return body;
}

export async function screenshot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" });
}

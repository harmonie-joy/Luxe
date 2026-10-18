import { defineConfig } from "@playwright/test";
import path from "node:path";
import { execFileSync } from "node:child_process";

if (!process.env.E2E_DATABASE_URL || process.env.E2E_ALLOW_ISOLATED_DATABASE !== "1") {
  throw new Error("Set E2E_DATABASE_URL and E2E_ALLOW_ISOLATED_DATABASE=1 for a disposable loopback PostgreSQL database named theluxe_e2e_*.");
}

const python = process.env.E2E_PYTHON ?? path.resolve("../backend/.venv/bin/python");
// Validate the same guard before Playwright can launch either application service.
execFileSync(python, ["e2e-real/db.py", "guard"], { stdio: "pipe" });

export default defineConfig({
  testDir: "./e2e-real",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: "test-results-real",
  reporter: [["list"], ["html", { outputFolder: "playwright-report-real", open: "never" }]],
  use: {
    browserName: "chromium",
    baseURL: "http://localhost:3154",
    viewport: { width: 1440, height: 900 },
    // Raw Playwright traces capture cookies/passwords; fixtures attach a safe HTTP timeline.
    trace: "off",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: `"${python}" e2e-real/db.py serve`,
      url: "http://localhost:8154/api/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --webpack --port 3154",
      url: "http://localhost:3154/login",
      env: { NEXT_PUBLIC_API_BASE_URL: "http://localhost:8154" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});

import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 * Tests run against real backend on localhost:8080
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true, // Safe to run in parallel
  forbidOnly: !!process.env.CI, // Fail if test.only in CI
  retries: process.env.CI ? 2 : 1, // Retry flaky tests
  workers: process.env.CI ? 1 : 2, // Limit to 2 workers locally to prevent resource exhaustion
  timeout: 30_000, // 30s per test
  expect: {
    timeout: 5000, // 5s for assertions
  },

  globalSetup: "./e2e/setup/global-setup.ts",

  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],

  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure", // Only record video on failure
    actionTimeout: 10_000,
    // Reduce resource usage
    launchOptions: {
      args: [
        "--disable-dev-shm-usage", // Overcome limited resource problems
        "--disable-gpu", // Disable GPU hardware acceleration
        "--no-sandbox", // Helpful for resource-limited environments
      ],
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start dev server automatically
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});

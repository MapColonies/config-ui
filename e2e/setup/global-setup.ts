import { chromium } from "@playwright/test";

/**
 * Global setup - Runs before all tests
 * Verifies backend server is running on localhost:8080
 */
async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("🔍 Checking backend server availability...");

  try {
    // Health check: verify backend is running
    // Using /schema/tree endpoint (requires no parameters)
    const response = await page.request.get(
      "http://localhost:8080/schema/tree",
    );

    if (!response.ok()) {
      throw new Error(
        `Backend server responded with ${response.status()} ${response.statusText()}`,
      );
    }

    console.log("✅ Backend server is ready on localhost:8080");
  } catch (err) {
    console.error("❌ Backend server not available on localhost:8080");
    console.error(
      "Please ensure the backend server is running before running E2E tests",
    );
    throw err;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

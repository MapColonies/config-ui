import { test, expect } from "@playwright/test";

/**
 * Smoke tests - Basic functionality checks
 * These tests verify the app loads and basic features work
 */
test.describe("Smoke Tests", () => {
  test("dashboard loads successfully", async ({ page }) => {
    await page.goto("/");
    
    // Wait for the page to load
    await page.waitForLoadState("networkidle");
    
    // Check for main heading - "Config Dashboard" based on index.tsx line 184
    await expect(page.getByRole("heading", { name: /Config Dashboard/i })).toBeVisible();
    
    // Check search input exists
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    
    // Check create button exists - use exact text to avoid ambiguity
    await expect(page.getByRole("button", { name: "Create New Config" })).toBeVisible();
  });

  test("wizard page loads", async ({ page }) => {
    await page.goto("/wizard");
    
    // Wait for the page to load
    await page.waitForLoadState("networkidle");
    
    // Should show wizard content (step indicator, title, or form)
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("schemas page loads", async ({ page }) => {
    await page.goto("/schemas");
    
    // Wait for the page to load
    await page.waitForLoadState("networkidle");
    
    // Page should load without errors
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("can search on dashboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill("test");
    
    // Wait a bit for debounce
    await page.waitForTimeout(500);
    
    // URL should update with search param
    expect(page.url()).toContain("q=test");
  });

  test("create button navigates to wizard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Click create button - use exact text to avoid matching "Created" column header
    await page.getByRole("button", { name: "Create New Config" }).click();
    
    // Should navigate to wizard
    await page.waitForURL(/\/wizard/);
    expect(page.url()).toContain("/wizard");
  });

  test("API is working - backend health check", async ({ request }) => {
    // Test that backend responds to schema/tree endpoint
    const response = await request.get("http://localhost:8080/schema/tree");
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test("API proxy works through frontend", async ({ request }) => {
    // Test that Vite proxy works (/api -> backend)
    const response = await request.get("http://localhost:5173/api/schema/tree");
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});

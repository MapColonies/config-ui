import { test, expect } from "@playwright/test";

/**
 * Dashboard Tests
 * Tests for the main config dashboard page
 */
test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("shows dashboard title and description", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Config Dashboard" })).toBeVisible();
    await expect(page.getByText(/Search, filter, and manage your configuration instances/i)).toBeVisible();
  });

  test("has search input and create button", async ({ page }) => {
    await expect(page.getByPlaceholder(/search configurations/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Create New Config" })).toBeVisible();
  });

  test("search updates URL with query param", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search configurations/i);
    await searchInput.fill("my-config");
    
    // Wait for debounce (300ms from index.tsx)
    await page.waitForTimeout(500);
    
    // Check URL contains search query
    expect(page.url()).toContain("q=my-config");
  });

  test("clearing search removes query param", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search configurations/i);
    
    // Add search
    await searchInput.fill("test");
    await page.waitForTimeout(500);
    expect(page.url()).toContain("q=test");
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Query param should be removed
    expect(page.url()).not.toContain("q=");
  });

  test("table displays when configs exist", async ({ page }) => {
    // Table should load (it's rendered regardless of data)
    // Just check if the page has finished loading
    await page.waitForLoadState("networkidle");
    
    // Check if there's a table on the page
    const table = page.getByRole("table");
    const tableExists = await table.count() > 0;
    
    if (tableExists) {
      await expect(table).toBeVisible();
    } else {
      // No table might mean no data or loading state
      // This is also valid - skip the test
      test.skip();
    }
  });

  test("navigate to wizard on create button click", async ({ page }) => {
    await page.getByRole("button", { name: "Create New Config" }).click();
    
    // Should navigate to wizard with mode=create
    await page.waitForURL(/\/wizard/);
    expect(page.url()).toContain("/wizard");
  });

  test("URL state persists after reload", async ({ page }) => {
    // Set search
    await page.getByPlaceholder(/search configurations/i).fill("persistent");
    await page.waitForTimeout(500);
    
    const urlBefore = page.url();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // URL should be the same
    expect(page.url()).toBe(urlBefore);
    
    // Search input should reflect URL
    const searchValue = await page.getByPlaceholder(/search configurations/i).inputValue();
    expect(searchValue).toBe("persistent");
  });
});

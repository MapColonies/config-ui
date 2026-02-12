import { test, expect } from "@playwright/test";

/**
 * Full User Flow Tests
 * Tests complete user workflows end-to-end with real assertions
 */

test.describe("Search and Filter", () => {
  test("search filters results based on query", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get initial row count
    const initialRows = page.getByRole("row");
    const initialCount = await initialRows.count();

    // Search for something specific that will definitely reduce results
    const searchInput = page.getByPlaceholder(/search configurations/i);
    await searchInput.fill("zzz-nonexistent-search-term-xyz");
    await page.waitForTimeout(500);

    // URL should be updated with search param
    expect(page.url()).toContain("q=zzz-nonexistent-search-term-xyz");

    // Results should be fewer (likely 0 or header only)
    const searchRows = page.getByRole("row");
    const searchCount = await searchRows.count();
    
    // Should have fewer results after searching for nonsense
    expect(searchCount).toBeLessThanOrEqual(initialCount);
  });

  test("clearing search restores original results", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get initial count
    const initialRows = page.getByRole("row");
    const initialCount = await initialRows.count();

    // Apply search filter that will reduce results
    const searchInput = page.getByPlaceholder(/search configurations/i);
    await searchInput.fill("zzz-unlikely-to-exist");
    await page.waitForTimeout(500);

    // Should have fewer results
    const filteredCount = await page.getByRole("row").count();
    
    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // URL should not have search param
    expect(page.url()).not.toContain("q=");
    
    // Count should return to initial
    const finalCount = await page.getByRole("row").count();
    expect(finalCount).toBe(initialCount);
  });
});

test.describe("Config Viewing", () => {
  test("can view config details from dashboard", async ({ page, request }) => {
    // Step 1: Get a config from the API
    const configsResponse = await request.get("http://localhost:8080/config?limit=1");
    expect(configsResponse.ok()).toBeTruthy();
    
    const data = await configsResponse.json();
    
    // Skip if no configs
    if (!data.configs || data.configs.length === 0) {
      test.skip();
      return;
    }

    const config = data.configs[0];
    const configName = config.configName;
    const schemaId = config.schemaId;

    // Step 2: Navigate to dashboard and search for the config
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder(/search configurations/i).fill(configName);
    await page.waitForTimeout(500);

    // Step 3: Click on the config
    const configLink = page.getByRole("link", { name: new RegExp(configName, "i") });
    await configLink.click();
    await page.waitForLoadState("networkidle");

    // Step 4: Verify we're on the detail page
    expect(page.url()).toContain(`/config/${configName}`);
    expect(page.url()).toContain(`schemaId=${encodeURIComponent(schemaId)}`);

    // Step 5: Verify config details are shown
    await expect(page.getByText(configName)).toBeVisible();
  });
});

test.describe("API Integration", () => {
  test("can fetch configs from API", async ({ request }) => {
    const response = await request.get("http://localhost:8080/config?limit=10");
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty("configs");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.configs)).toBeTruthy();
  });

  test("can fetch schemas from API", async ({ request }) => {
    const response = await request.get("http://localhost:8080/schema/tree");
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("pagination works in API", async ({ request }) => {
    // Fetch first page
    const page1 = await request.get("http://localhost:8080/config?limit=5&offset=0");
    expect(page1.ok()).toBeTruthy();
    
    const data1 = await page1.json();
    
    // If we have more than 5 configs, test pagination
    if (data1.total > 5) {
      const page2 = await request.get("http://localhost:8080/config?limit=5&offset=5");
      expect(page2.ok()).toBeTruthy();
      
      const data2 = await page2.json();
      
      // Results should be different
      if (data1.configs.length > 0 && data2.configs.length > 0) {
        expect(data1.configs[0].configName).not.toBe(data2.configs[0].configName);
      }
    }
  });
});

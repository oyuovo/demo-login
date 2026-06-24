import { test, expect } from "@playwright/test";

const TEST_USER = `e2e_${Date.now()}`;
const TEST_PASSWORD = "e2e_password_123";

test.describe("Main user flow", () => {
  test("register, access resources, and logout", async ({ page }) => {
    await page.goto("/login");

    // Should see login page
    await expect(page.locator(".auth-title")).toHaveText("Community Gate");

    // Switch to register
    await page.click("text=注册");

    // Fill form
    await page.fill("#username", TEST_USER);
    await page.fill("#password", TEST_PASSWORD);

    // Submit registration
    await page.click("button[type=submit]");

    // Should redirect to dashboard
    await expect(page.locator(".dash-title")).toHaveText("Community Gate", {
      timeout: 15000,
    });

    // Should see username in header
    await expect(page.locator(".user-name")).toHaveText(TEST_USER);

    // Should see MEMBER badge
    await expect(page.locator(".role-badge.member")).toBeVisible();

    // Resource A should show as granted
    await expect(page.locator(".resource-card:first-child .access-badge.granted")).toBeVisible({
      timeout: 10000,
    });

    // Resource B should show as denied
    await expect(page.locator(".access-badge.denied")).toBeVisible({
      timeout: 10000,
    });

    // Logout
    await page.click("text=退出登录");

    // Should redirect to login page
    await expect(page.locator(".auth-title")).toBeVisible({ timeout: 5000 });
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#username", "nonexistent_user");
    await page.fill("#password", "wrong_password");

    await page.click("button[type=submit]");

    // Should show error message
    await expect(page.locator(".error-msg")).toBeVisible({ timeout: 5000 });
  });
});

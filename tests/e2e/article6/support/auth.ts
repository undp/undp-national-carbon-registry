import { Page, expect } from "@playwright/test";

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3030";
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:3000";

export const USERS = {
  dnaAdmin: { email: "palinda+add@xeptagon.com", password: "123" },
  pdAdmin: { email: "palinda+dev@xeptagon.com", password: "123" },
  icAdmin: { email: "palinda+cet@xeptagon.com", password: "123" },
  apiUser: { email: "palinda+api@xeptagon.com", password: "123" },
} as const;

export type UserKey = keyof typeof USERS;

export async function dismissOverlay(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      const ids = ["webpack-dev-server-client-overlay"];
      ids.forEach((id) => document.getElementById(id)?.remove());
      document.querySelector("vite-error-overlay")?.remove();
      document
        .querySelectorAll('iframe[src="about:blank"]')
        .forEach((el) => el.remove());
    });
  } catch {
    // no overlay to remove
  }
}

export async function login(
  page: Page,
  user: UserKey | { email: string; password: string } = "dnaAdmin"
): Promise<void> {
  const creds = typeof user === "string" ? USERS[user] : user;
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await dismissOverlay(page);
  await page.locator(".login-input-email input").fill(creds.email);
  await page.locator(".login-input-password input").fill(creds.password);
  await dismissOverlay(page);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

export async function expectLoggedOut(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/);
}

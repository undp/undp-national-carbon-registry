const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

const rootDir = path.resolve(__dirname, "../..");
const smokeScript = path.join(rootDir, "scripts/regional-market-smoke.sh");
const baseUrl =
  process.env.REGIONAL_DASHBOARD_WEB_BASE || "http://127.0.0.1:3030";

const smokeEnv = {
  ...process.env,
  REGIONAL_MARKET_API_BASE:
    process.env.REGIONAL_MARKET_API_BASE || "http://127.0.0.1:3001",
};

function runSmoke(command) {
  execFileSync("bash", [smokeScript, command], {
    cwd: rootDir,
    env: smokeEnv,
    stdio: "inherit",
  });
}

async function openDashboard(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`${baseUrl}/command-center`, { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "区域碳资产监管运营终端" })
  ).toBeVisible();
  await expect(page.getByText("登记簿生命周期与已执行场外协议成交信息")).toBeVisible();
  await expect(page.getByText("不展示撮合、盘口、平台清算或银行结算能力")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("可问：");
  await expect(page.locator("body")).not.toContainText("NaN");
  expect(errors, "browser console/page errors").toEqual([]);
}

test.describe("regional command-center dashboard UI", () => {
  test("walks from empty projection to populated dashboard with real browser interactions", async ({
    page,
  }) => {
    test.setTimeout(120000);

    runSmoke("reset-dashboard-demo");
    await openDashboard(page);
    await expect(page.getByText("开户主体")).toBeVisible();
    await expect(page.locator("body")).toContainText("0 家");
    await expect(page.locator("body")).toContainText("0 个");
    await page.screenshot({
      path: path.join(rootDir, "test-results/regional-dashboard-empty.png"),
      fullPage: true,
    });

    runSmoke("seed-dashboard-accounts");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("15 家");
    await expect(page.locator("body")).toContainText("项目业主");
    await expect(page.locator("body")).toContainText("10 家");
    await expect(page.locator("body")).toContainText("核证机构");
    await expect(page.locator("body")).toContainText("4 家");

    runSmoke("seed-dashboard-project");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("15 个");
    await expect(page.locator("body")).toContainText("区域");

    runSmoke("seed-dashboard-issuance");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("15,000 吨");

    runSmoke("seed-dashboard-trade");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("4,500 吨");
    await expect(page.locator("body")).toContainText("18.90 万元");
    await expect(page.locator("body")).toContainText("42.00 元/吨");
    await expect(page.locator("body")).toContainText("区域项目业主");
    await expect(page.locator("body")).not.toContainText("Smoke");

    runSmoke("seed-dashboard-retirement");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("最近场外协议成交信息")).toBeVisible();
    await expect(page.locator(".cc-henan-map__trade-flow")).toHaveCount(1);
    await expect(page.locator("body")).not.toContainText("Smoke");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth
        )
      )
      .toBe(true);
    await page.getByRole("button", { name: "重播" }).click();
    await expect(page.getByText("0/50 条")).toBeVisible();
    await expect(page.locator("body")).toContainText("0 家");
    await expect(page.locator("body")).toContainText("0 个");
    await expect(page.locator("body")).not.toContainText("15 家");

    runSmoke("seed-dashboard-pending-retirement");
    runSmoke("dashboard-demo-smoke");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("50/50 条")).toBeVisible({ timeout: 65000 });
    await expect(page.locator("body")).toContainText("2,100 吨 · 87 分", {
      timeout: 20000,
    });
    await expect(page.locator("body")).toContainText("1,200 吨 · 73 分", {
      timeout: 20000,
    });
    await expect(page.locator("body")).not.toContainText("NaN");

    await page.mouse.wheel(0, 700);
    await expect(page.getByText("不含：盘口/撮合/清算")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("可问：");
    await page.screenshot({
      path: path.join(rootDir, "test-results/regional-dashboard-full.png"),
      fullPage: true,
    });
  });
});

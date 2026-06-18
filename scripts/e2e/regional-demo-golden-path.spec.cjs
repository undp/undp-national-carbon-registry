const { expect, test } = require("@playwright/test");

const baseUrl =
  process.env.REGIONAL_DASHBOARD_WEB_BASE || "http://127.0.0.1:3030";

test.describe("regional demo phase-two golden path", () => {
  test("walks S12 source, S8 deal, S10 intent, and government return", async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/command-center`, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { name: "S12 真实公开指标驾驶舱" })
    ).toBeVisible();
    await page.getByRole("button", { name: /郑州市/ }).click();
    await expect(page.getByLabel("来源明细")).toContainText("郑州市统计局");

    await page.getByRole("button", { name: "企业" }).click();
    await page.getByRole("button", { name: "转入交易上下文" }).click();
    await page.getByRole("button", { name: "创建挂牌" }).click();
    await page.getByRole("button", { name: "确认演示成交" }).click();
    await expect(page.getByText("演示文本，不具法律效力")).toBeVisible();
    await expect(page.getByText("模拟成交状态凭证")).toBeVisible();

    await page.getByRole("button", { name: "金融" }).click();
    await page.getByRole("button", { name: "提交融资意向" }).click();
    await expect(page.getByText("模拟审批不代表银行授信")).toBeVisible();
    await expect(page.getByText("PLEDGE_LOCKED")).toBeVisible();

    await page.getByRole("button", { name: "政府" }).click();
    await expect(page.getByText("真实公开数据", { exact: true })).toBeVisible();
    await expect(page.getByText("模拟交易活动")).toBeVisible();
    await expect(page.getByText("模拟融资意向")).toBeVisible();
    await expect(page.getByText("INTERNAL_DEMO_LOGIC")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("NaN");
  });

  test("does not allow S8 transfer after S10 pledge lock", async ({ page }) => {
    await page.goto(`${baseUrl}/command-center`, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "金融" }).click();
    await page.getByRole("button", { name: "提交融资意向" }).click();
    await expect(page.getByText("PLEDGE_LOCKED")).toBeVisible();
    await expect(page.getByText("质押意向已锁定演示资产")).toBeVisible();

    const transferButton = page.getByRole("button", { name: "转入交易上下文" });
    await expect(transferButton).toBeDisabled();
    await expect(page.getByText("交易可用 0 吨")).toBeVisible();
  });

  test("operator can quick fill and reset the demo", async ({ page }) => {
    await page.goto(`${baseUrl}/command-center`, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "操作" }).click();
    await expect(page.getByLabel("操作员恢复台")).toBeVisible();
    await page.getByRole("button", { name: "一键补齐S8" }).click();
    await expect(page.getByText("成交：800 吨 · 33,600.00 元")).toBeVisible();
    await page.getByRole("button", { name: "复位演示" }).click();
    await expect(page.getByText("交易可用 0 吨")).toBeVisible();
  });
});

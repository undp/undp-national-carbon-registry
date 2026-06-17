const { expect, test } = require("@playwright/test");

const baseUrl =
  process.env.REGIONAL_DASHBOARD_WEB_BASE || "http://127.0.0.1:3030";

test.describe("regional demo phase-one cockpit", () => {
  test("shows government role, S12 sources, and prototype placeholders", async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(`${baseUrl}/command-center`, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { name: "区域碳资产监管运营终端" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "S12 真实公开指标驾驶舱" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "政府" })).toHaveClass(
      /is-active/
    );
    await expect(page.getByText("已核验公开来源").first()).toBeVisible();

    await page.getByRole("button", { name: /郑州市/ }).click();
    await expect(page.getByLabel("来源明细")).toContainText("郑州市统计局");
    await expect(page.getByRole("link", { name: "查看公开来源" })).toBeVisible();

    await page.getByRole("button", { name: "金融" }).click();
    await expect(page.getByText("当前角色：金融")).toBeVisible();
    await expect(page.getByText("模拟运营信号")).toBeVisible();
    await expect(page.getByText("演示合同预览")).toBeVisible();
    await expect(page.getByText("融资测算")).toBeVisible();
    await expect(page.getByText("质押意向申请")).toBeVisible();
    await expect(page.getByText("模拟审批结果")).toBeVisible();

    await expect(page.locator("body")).not.toContainText("NaN");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth
        )
      )
      .toBe(true);
    expect(errors, "browser console/page errors").toEqual([]);
  });
});

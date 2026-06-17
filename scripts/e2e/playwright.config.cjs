module.exports = {
  testDir: ".",
  testMatch: /regional-(dashboard-ui|demo-phase-one)-smoke\.spec\.cjs/,
  timeout: 120000,
  use: {
    browserName: "chromium",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  workers: 1,
};

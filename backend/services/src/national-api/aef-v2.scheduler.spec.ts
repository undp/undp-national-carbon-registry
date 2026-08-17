import { AefV2ReportService } from "@app/shared/aef-v2-registry/aef-v2-report.service";
import { ConfigService } from "@nestjs/config";
import { ScheduleModule, SchedulerRegistry } from "@nestjs/schedule";
import { Test, TestingModule } from "@nestjs/testing";

import { AefV2SchedulerService } from "./aef-v2.scheduler";

describe("AefV2SchedulerService", () => {
  const rolloverResult = {
    openedYear: 2027,
    submission: {},
    submissionCreated: true,
    closedYear: 2026,
    holdings: { reportedYear: 2026, rows: [{}], created: true },
    authorizedEntities: { reportedYear: 2026, rows: [{}], created: true },
  };

  let module: TestingModule;
  let service: AefV2SchedulerService;
  let reportService: { rollover: jest.Mock };
  let configGet: jest.Mock;

  const buildModule = async () => {
    reportService = { rollover: jest.fn().mockResolvedValue(rolloverResult) };
    configGet = jest.fn().mockReturnValue(undefined);

    module = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [
        AefV2SchedulerService,
        { provide: AefV2ReportService, useValue: reportService },
        { provide: ConfigService, useValue: { get: configGet } },
      ],
    }).compile();

    // Cron registration happens on the application-bootstrap lifecycle hook.
    await module.init();
    service = module.get(AefV2SchedulerService);
  };

  afterEach(async () => {
    await module?.close();
  });

  it("registers a job firing at 01:00 UTC on 1 January", async () => {
    await buildModule();

    const registry = module.get(SchedulerRegistry);
    const job = registry.getCronJob("aefV2YearRollover");

    expect(job.cronTime.source).toBe("0 1 1 1 *");
  });

  it("runs the rollover exactly once when the cron flag is not disabled", async () => {
    await buildModule();

    await service.handleYearRollover();

    expect(reportService.rollover).toHaveBeenCalledTimes(1);
    expect(reportService.rollover).toHaveBeenCalledWith();
  });

  it("skips the rollover when AEF_V2.rolloverCronEnabled is false", async () => {
    await buildModule();
    configGet.mockReturnValue(false);

    await service.handleYearRollover();

    expect(reportService.rollover).not.toHaveBeenCalled();
  });

  it("catches and logs a rollover failure instead of rethrowing", async () => {
    await buildModule();
    reportService.rollover.mockRejectedValue(new Error("boom"));

    await expect(service.handleYearRollover()).resolves.toBeUndefined();
  });
});

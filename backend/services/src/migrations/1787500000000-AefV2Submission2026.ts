import { MigrationInterface, QueryRunner } from "typeorm";

// AEF V2 start-of-year rollover (UNCR-468) is landing mid-2026, so no
// January-firing cron ever created 2026's Table 1 Submission row. Seeds it
// by hand — backfilling 2025 and earlier is explicitly out of scope; those
// years have no Submission row and no frozen Table 4/5 snapshot, and their
// holdings are no longer reconstructible from current credit-block state.
//
// Resolves the same three values aef-v2-defaults.factory.ts resolves at
// runtime, but from process.env directly since a migration runs outside
// Nest DI:
//   - party: AEF_PARTY, else an alpha-3 lookup of systemCountryCode (falls
//     back to "NG", matching configuration.ts's systemCountry default)
//     against the "country" table.
//   - NDC first/last year: AEF_NDC_FIRST_YEAR / AEF_NDC_LAST_YEAR, falling
//     back to 2021 / 2030 exactly as configuration.ts does.
//
// If party cannot be resolved (a fresh install's "country" table is created
// by Baseline but not populated until the setup handler runs), this logs and
// skips rather than failing — ensureSubmissionForYear creates the row lazily
// on first write, and a fresh install has no 2026 data worth seeding anyway.
// Failing here would break first-boot for every new deployment.
//
// The insert checks (party, reportYear) only, not the full unique
// constraint's (party, reportYear, version) — a plain ON CONFLICT guard on
// the real constraint would still insert a stray "1.0" row alongside an
// already-revised "1.1", producing two live rows for the year.
//
// Written by hand rather than via `migration:generate` - the local dev DB
// runs with synchronize=true (NODE_ENV=dev) and has already auto-synced this
// schema. Same convention as 1787400000000-AefV2T5SnapshotAt.ts.
export class AefV2Submission20261787500000000 implements MigrationInterface {
  name = "AefV2Submission20261787500000000";

  private static readonly REPORT_YEAR = 2026;
  private static readonly INITIAL_VERSION = "1.0";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const party = await this.resolveParty(queryRunner);
    if (!party) {
      console.warn(
        `[AefV2Submission20261787500000000] Could not resolve an AEF Party code ` +
          `(AEF_PARTY unset and systemCountryCode not found in "country"); skipping ` +
          `the 2026 Submission seed. It will be created lazily on first AEF V2 write.`
      );
      return;
    }

    const ndcFirstYear = parseInt(process.env.AEF_NDC_FIRST_YEAR, 10) || 2021;
    const ndcLastYear = parseInt(process.env.AEF_NDC_LAST_YEAR, 10) || 2030;

    await queryRunner.query(
      `INSERT INTO "aef_v2_t1_submission"
         ("aefT1SubmissionParty", "aefT1SubmissionVersion", "aefT1SubmissionReportYear",
          "aefT1SubmissionNdcFirstYear", "aefT1SubmissionNdcLastYear", "status")
       SELECT $1, $2, $3, $4, $5, 'DRAFT'
       WHERE NOT EXISTS (
         SELECT 1 FROM "aef_v2_t1_submission"
         WHERE "aefT1SubmissionParty" = $1 AND "aefT1SubmissionReportYear" = $3
       )`,
      [
        party,
        AefV2Submission20261787500000000.INITIAL_VERSION,
        AefV2Submission20261787500000000.REPORT_YEAR,
        ndcFirstYear,
        ndcLastYear,
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Only ever removes the untouched draft this migration itself could have
    // created, and only when nothing downstream references it — Table
    // 2/3/4/5 rows CASCADE off "aefT1SubmissionId", so an unguarded delete
    // would silently take real report data with it.
    await queryRunner.query(
      `DELETE FROM "aef_v2_t1_submission"
       WHERE "aefT1SubmissionReportYear" = $1
         AND "aefT1SubmissionVersion" = $2
         AND "status" = 'DRAFT'
         AND "id" NOT IN (SELECT "aefT1SubmissionId" FROM "aef_v2_t2_authorizations" WHERE "aefT1SubmissionId" IS NOT NULL)
         AND "id" NOT IN (SELECT "aefT1SubmissionId" FROM "aef_v2_t3_actions" WHERE "aefT1SubmissionId" IS NOT NULL)
         AND "id" NOT IN (SELECT "aefT1SubmissionId" FROM "aef_v2_t4_holdings" WHERE "aefT1SubmissionId" IS NOT NULL)
         AND "id" NOT IN (SELECT "aefT1SubmissionId" FROM "aef_v2_t5_authorized_entities" WHERE "aefT1SubmissionId" IS NOT NULL)`,
      [AefV2Submission20261787500000000.REPORT_YEAR, AefV2Submission20261787500000000.INITIAL_VERSION]
    );
  }

  private async resolveParty(queryRunner: QueryRunner): Promise<string | undefined> {
    if (process.env.AEF_PARTY) {
      return process.env.AEF_PARTY;
    }

    const systemCountryCode = process.env.systemCountryCode || "NG";
    const rows = await queryRunner.query(`SELECT "alpha3" FROM "country" WHERE "alpha2" = $1`, [
      systemCountryCode,
    ]);
    return rows?.[0]?.alpha3;
  }
}

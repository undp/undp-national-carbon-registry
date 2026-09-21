import { ViewColumn, ViewEntity } from "typeorm";
import { NdcType } from "../enum/ndc.type.enum";

// Expands each ndc_target period row into one target per year, on a
// straight line from (baseYear, baseYearEmission) to (targetYear,
// ndcTarget) — the Trajectory method of Dec 2/CMA.3 para 7a(i). A
// mid-period year is then judged against its own point on the path
// rather than the final-year ceiling.
//
// Only SingleYear is emitted: MultiYear NDCs are not supported yet, so
// their rows are filtered out rather than interpolated with a formula
// that would not apply to a cumulative budget. Adding MultiYear later
// means a CASE branch here, with no schema change.
//
// The guards on targetYear/baseYear mirror the validation in
// InitialReportService — they exist so a hand-inserted or migrated row
// with a bad span yields no rows instead of a divide-by-zero.
@ViewEntity({
  name: "ndc_target_yearly",
  expression: `
      SELECT
        y AS "targetYear",
        t."country" AS "country",
        t."ndcType" AS "ndcType",
        t."baseYear" AS "baseYear",
        t."baseYearEmission" AS "baseYearEmission",
        t."ndcTarget" AS "periodTarget",
        t."sourceReportNumber" AS "sourceReportNumber",
        ROUND(
          t."baseYearEmission"
            + (t."ndcTarget" - t."baseYearEmission")
              * (y - t."baseYear")::numeric
              / (t."targetYear" - t."baseYear")::numeric
        , 5) AS "singleYearTarget"
      FROM "ndc_target" t
      CROSS JOIN LATERAL generate_series(t."ndcStartYear", t."ndcEndYear") AS y
      WHERE t."ndcType" = 'SingleYear'
        AND t."baseYear" IS NOT NULL
        AND t."baseYearEmission" IS NOT NULL
        AND t."targetYear" IS NOT NULL
        AND t."ndcTarget" IS NOT NULL
        AND t."targetYear" > t."baseYear"
    `,
})
export class NdcTargetYearlyViewEntity {
  @ViewColumn()
  targetYear: number;

  @ViewColumn()
  country: string;

  @ViewColumn()
  ndcType: NdcType;

  @ViewColumn()
  baseYear: number;

  @ViewColumn()
  baseYearEmission: number;

  // The period's filed target, i.e. the value at targetYear. Kept
  // alongside so a caller can see the destination as well as this
  // year's interpolated point.
  @ViewColumn()
  periodTarget: number;

  @ViewColumn()
  sourceReportNumber: string;

  @ViewColumn()
  singleYearTarget: number;
}

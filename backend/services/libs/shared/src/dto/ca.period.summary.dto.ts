import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";
import { CaStatus } from "../enum/ca.status.enum";

// One column of the period table. Every year in [ndcStartYear,
// ndcEndYear] gets exactly one of these, in ascending order with no
// gaps — a year with no saved adjustment still appears, carrying only
// its interpolated ndcTarget so the trajectory row is always complete.
export class CaPeriodYearDto {
  @ApiProperty()
  year: number;

  // ndc_target_yearly.singleYearTarget — the "Indicative trajectory" row.
  @ApiPropertyOptional()
  ndcTarget: number | null;

  // "Annual emissions" row.
  @ApiPropertyOptional()
  annualEmission: number | null;

  // "Corresponding adjustment" row.
  @ApiPropertyOptional()
  appliedAdjustment: number | null;

  // "Adjusted emission balance" row = annualEmission + appliedAdjustment,
  // null when either input is missing.
  @ApiPropertyOptional()
  adjustedBalance: number | null;

  @ApiPropertyOptional()
  caId: string | null;

  @ApiPropertyOptional()
  status: CaStatus | null;

  // Set on the reporting year's column of a /preview response, to mark
  // the one column that is computed-but-not-yet-saved.
  @ApiPropertyOptional()
  isPreview?: boolean;
}

export class CaPeriodSummaryDto {
  // false => no NDC period covers the requested year. Returned with a
  // 200 rather than a 400 so the UI can show a calm inline warning
  // instead of an error toast.
  @ApiProperty()
  hasNdcTarget: boolean;

  @ApiPropertyOptional()
  ndcStartYear: number | null;

  @ApiPropertyOptional()
  ndcEndYear: number | null;

  @ApiPropertyOptional()
  ndcType: NdcType | null;

  @ApiPropertyOptional()
  caMethod: CaMethod | null;

  // false => caMethod could not be derived (the period's ndc_target has
  // no sourceReportNumber). The UI should then let the user pick one,
  // and /save will honour caMethodOverride.
  @ApiProperty()
  caMethodResolved: boolean;

  @ApiPropertyOptional()
  sourceReportNumber: string | null;

  @ApiProperty({ type: [CaPeriodYearDto] })
  years: CaPeriodYearDto[];
}

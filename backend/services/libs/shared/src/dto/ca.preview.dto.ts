import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";
import { CaMethod } from "../enum/ca.method.enum";

// Computes a corresponding adjustment WITHOUT persisting anything.
//
// ndcType and caMethod are deliberately absent: both are resolved
// server-side from the NDC period covering `year` (ndc_target, and the
// initial report it was filed from), so the caller cannot pick a method
// that disagrees with what was actually filed.
export class CaPreviewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(1900)
  year: number;

  // The reporting year's actual emissions. Collected here rather than
  // read from the Emission table so a calculation never depends on a
  // separate inventory record existing first.
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  reportingYearEmission: number;

  // Honoured ONLY when the server cannot resolve the method itself —
  // i.e. the period's ndc_target has no sourceReportNumber, which
  // happens for targets migrated in from outside the registry. When the
  // method is resolvable the server-derived value always wins.
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(CaMethod)
  caMethodOverride?: CaMethod;
}

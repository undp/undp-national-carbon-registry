import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { CaPreviewDto } from "./ca.preview.dto";

// Same inputs as a preview, but persists the result. Creates the year's
// record if it doesn't exist, or overwrites it in place while it's still
// a Draft — there is exactly one row per year (see the entity's
// UQ_corresponding_adjustment_year).
export class CaSaveDto extends CaPreviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  // true => save and immediately submit, subject to the same year/period
  // gate as PUT /submit. false (default) => save as Draft.
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}

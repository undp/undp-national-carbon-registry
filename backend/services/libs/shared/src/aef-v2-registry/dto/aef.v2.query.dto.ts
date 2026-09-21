import { AEF_TABLE_NAMES, AefTableName } from "@app/aef-v2";
import { ApiProperty, ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, ValidateNested } from "class-validator";

import { SortEntry } from "../../dto/sort.entry";

export class AefV2QueryDto {
  @ApiProperty({ enum: AEF_TABLE_NAMES })
  @IsIn(AEF_TABLE_NAMES)
  @IsNotEmpty()
  table: AefTableName;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  reportedYear: number;

  /**
   * Same shape the other tables' `queryExplorer` uses, so the frontend's sort
   * handling is one pattern rather than two. Omitted means newest-first by
   * `updatedAt` — see AefV2ReportService.DEFAULT_SORT.
   */
  @ApiPropertyOptional({
    type: "object",
    example: { key: "updatedAt", order: "DESC" },
    items: {
      $ref: getSchemaPath(SortEntry),
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SortEntry)
  sort?: SortEntry;
}

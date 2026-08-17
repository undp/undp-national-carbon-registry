import { AEF_TABLE_NAMES, AefTableName } from "@app/aef-v2";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive } from "class-validator";

import { ExportFileType } from "../../enum/export.file.type.enum";

export class AefV2ExportDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  reportedYear: number;

  @ApiProperty({ enum: ExportFileType })
  @IsEnum(ExportFileType)
  @IsNotEmpty()
  fileType: ExportFileType;

  @ApiPropertyOptional({
    enum: AEF_TABLE_NAMES,
    description: "Export one table only. Omit for the whole submission.",
  })
  @IsOptional()
  @IsIn(AEF_TABLE_NAMES)
  table?: AefTableName;
}

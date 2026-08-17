import { AEF_TABLE_NAMES, AefTableName } from "@app/aef-v2";
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsPositive } from "class-validator";

export class AefV2QueryDto {
  @ApiProperty({ enum: AEF_TABLE_NAMES })
  @IsIn(AEF_TABLE_NAMES)
  @IsNotEmpty()
  table: AefTableName;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  reportedYear: number;
}

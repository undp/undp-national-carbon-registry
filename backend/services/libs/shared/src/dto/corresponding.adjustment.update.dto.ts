import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CaMethod } from "../enum/ca.method.enum";

// Only caMethod and remarks are directly editable on a Draft
// corresponding-adjustment record — the quantitative fields are
// derived from ledger data; changing caMethod re-runs the calculation
// in place rather than accepting hand-edited numbers.
export class CorrespondingAdjustmentUpdateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  caId: string;

  @ApiPropertyOptional({ enum: CaMethod })
  @IsOptional()
  @IsEnum(CaMethod)
  caMethod?: CaMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

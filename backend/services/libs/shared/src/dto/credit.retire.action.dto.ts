import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { RetirementACtionEnum } from "../enum/retirement.action.enum";

export class CreditRetireActionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ enum: RetirementACtionEnum })
  @IsEnum(RetirementACtionEnum)
  @IsNotEmpty()
  action: RetirementACtionEnum;

  @ApiPropertyOptional()
  @ValidateIf(
    (o) =>
      o.action === RetirementACtionEnum.CANCEL ||
      o.action === RetirementACtionEnum.REJECT
  )
  @IsString()
  @IsNotEmpty()
  remarks?: string;
}

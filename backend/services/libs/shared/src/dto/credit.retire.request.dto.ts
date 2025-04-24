import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsPositive,
  ValidateIf,
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { CreditRetirementTypeEnum } from "../enum/credit.retirement.type.enum";

export class CreditRetireRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  blockId: string;

  @ApiProperty()
  @IsPositive()
  @IsInt()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ enum: CreditRetirementTypeEnum })
  @IsEnum(CreditRetirementTypeEnum)
  @IsNotEmpty()
  retirementType: CreditRetirementTypeEnum;

  @ApiProperty()
  @ValidateIf(
    (o) =>
      o.retirementType === CreditRetirementTypeEnum.CROSS_BORDER_TRANSACTIONS
  )
  @IsString()
  country?: string;

  @ApiProperty()
  @ValidateIf(
    (o) =>
      o.retirementType === CreditRetirementTypeEnum.CROSS_BORDER_TRANSACTIONS
  )
  @IsNotEmpty()
  @IsString()
  organizationName?: string;
}

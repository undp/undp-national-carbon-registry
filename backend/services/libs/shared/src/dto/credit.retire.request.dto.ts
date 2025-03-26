import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsPositive,
  ValidateIf,
  IsEnum,
  IsString,
  IsNotEmpty,
} from "class-validator";
import { CreditRetirementTypeEnum } from "../enum/credit.retirement.type.enum";

export class CreditRetireRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  creditBlockId: string;

  @ApiProperty()
  @IsPositive()
  @IsInt()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  remarks: string;

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
  @IsNotEmpty()
  country: string;
}

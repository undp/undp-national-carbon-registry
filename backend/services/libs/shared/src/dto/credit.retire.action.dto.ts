import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { RetirementACtionEnum } from "../enum/retirement.action.enum";

export class CreditRetireActionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transferId: string;

  @ApiProperty({ enum: RetirementACtionEnum })
  @IsEnum(RetirementACtionEnum)
  @IsNotEmpty()
  action: RetirementACtionEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  remarks: string;
}

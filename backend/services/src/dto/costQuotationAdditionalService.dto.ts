import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CostQuotationAdditionalServiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  service: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  cost: number;
}

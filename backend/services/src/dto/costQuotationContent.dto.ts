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
import { CostQuotationAdditionalServiceDto } from "./costQuotationAdditionalService.dto";

export class CostQuotationContentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  quotationNo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  dateOfIssue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  costValidation: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  costVerification: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  totalCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => CostQuotationAdditionalServiceDto)
  additionalServices: CostQuotationAdditionalServiceDto[];

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  signature: string[];
}

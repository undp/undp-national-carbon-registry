import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";

export class ValidationReportYearlyGHGEmissionReduction {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  startDate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  endDate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  baselineEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  leakageEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  netEmissionReductions: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bufferPoolAllocation?: number;
}

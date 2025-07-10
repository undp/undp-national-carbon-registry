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
import { GHGSource } from "./ghgSource.dto";
import { ValidationReportYearlyGHGEmissionReduction } from "./validationReportYearlyGHGEmissionReductions.dto";

export class ValidationReportNetEmissionReductions {
  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportYearlyGHGEmissionReduction)
  yearlyGHGEmissionReductions: ValidationReportYearlyGHGEmissionReduction[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalBaselineEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalProjectEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalLeakageEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalNetEmissionReductions: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalBufferPoolAllocations?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalNumberOfCredingYears: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  avgBaselineEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  avgProjectEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  avgLeakageEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  avgNetEmissionReductions: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  avgBufferPoolAllocations?: number;
}

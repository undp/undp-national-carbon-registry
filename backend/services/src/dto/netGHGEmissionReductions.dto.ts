import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { GHGSource } from "./ghgSource.dto";
import { YearlyGHGEmissionReduction } from "./yearlyGHGEmissionReduction.dto";

export class NetGHGEmissionReductions {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => YearlyGHGEmissionReduction)
  yearlyGHGEmissionReductions: YearlyGHGEmissionReduction[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  totalBaselineEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  totalProjectEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  totalLeakageEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  totalNetEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  totalNumberOfCredingYears: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  avgBaselineEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  avgProjectEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  avgLeakageEmissionReductions: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  avgNetEmissionReductions: number;
}

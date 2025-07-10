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
}

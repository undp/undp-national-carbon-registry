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

export class YearlyGHGEmissionReduction {
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
}

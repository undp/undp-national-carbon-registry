import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";

export class ValidationReportLocationWiseBaselineEmission {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectCapacityValue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  plantFactorValue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  avgEnergyOutputValue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  gridEmissionFactorValue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  emissionReductionValue: number;
}

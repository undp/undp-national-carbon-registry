import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { GHGSource } from "./ghgSource.dto";
import { NetGHGEmissionReductions } from "./netGHGEmissionReductions.dto";

export class QuantificationOfGHG {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  baselineEmissions: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectEmissions: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  leakage: string;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => NetGHGEmissionReductions)
  netGHGEmissionReductions: NetGHGEmissionReductions;
}

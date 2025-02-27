import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
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
import { GHGSource } from "./ghgSource.dto";
import { NetGHGEmissionReductions } from "./netGHGEmissionReductions.dto";
import { ValidationParameters } from "./validationParameters.dto";
import { MonitoredParameters } from "./monitoredParameters.dto";

export class Appendix {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  annexures: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  additionalDocuments: string[];
}

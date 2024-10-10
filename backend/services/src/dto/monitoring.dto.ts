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
import { ValidationParameters } from "./validationParameters.dto";
import { MonitoredParameters } from "./monitoredParameters.dto";

export class Monitoring {
  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationParameters)
  validationParameters: ValidationParameters;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => MonitoredParameters)
  monitoredParameters: MonitoredParameters;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  monitoringPlan: string;
}

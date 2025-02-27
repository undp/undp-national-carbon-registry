import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { ProjectProponent } from "./projectProponent.dto";
import { ValidationReportParameterValue } from "./validationReportParameterValue.dto";

export class ValidationReportTechnicalProjectDescription {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  item: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportParameterValue)
  parameterValue: ValidationReportParameterValue[];
}

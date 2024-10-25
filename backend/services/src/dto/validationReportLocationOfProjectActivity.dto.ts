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
import { ValidationReportTechnicalProjectDescription } from "./validationReportTechnicalProjectDescription.dto";

export class ValidationReportLocationOfProjectActivity {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  locationOfProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  dsDivision: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  community: string;

  @ApiProperty()
  @IsArray()
  geographicalLocationCoordinates: [];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  additionalDocuments: string[];

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportTechnicalProjectDescription)
  technicalProjectDescription: ValidationReportTechnicalProjectDescription[];
}

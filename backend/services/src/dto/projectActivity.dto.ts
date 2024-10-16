import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { ProjectProponent } from "./projectProponent.dto";
import { LocationOfProjectActivity } from "./locationOfProjectActivity.dto";
import { CreditType } from "../enum/creditType.enum";
import { ProjectScaleType } from "../enum/projectScaleType.enum";
import { EstimatedAnnualGHGEmissions } from "./estimatedAnnualGHGEmissions.dto";

export class ProjectActivity {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  introduction: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sectoralScopeAndProjectType: string;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ProjectProponent)
  projectProponent: ProjectProponent;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectProponent)
  otherEntities: ProjectProponent[];

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LocationOfProjectActivity)
  locationsOfProjectActivity: LocationOfProjectActivity[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectOwnership: string;

  @ApiProperty({ enum: CreditType })
  @IsNotEmpty()
  @IsEnum(CreditType, {
    message: "Invalid credit type. Supported following credit type:" + Object.values(CreditType),
  })
  projectTrack: CreditType;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  creditingPeriodStartDate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  creditingPeriodEndDate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  creditingPeriodDescription: string;

  @ApiProperty({ enum: ProjectScaleType })
  @IsNotEmpty()
  @IsEnum(ProjectScaleType, {
    message:
      "Invalid project scale type. Supported following project scale type:" +
      Object.values(ProjectScaleType),
  })
  projectScaleType: ProjectScaleType;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EstimatedAnnualGHGEmissions)
  estimatedAnnualGHGEmissions: EstimatedAnnualGHGEmissions[];

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  totalEstimatedGHGERs: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  totalCreditingYears: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  avgAnnualERs: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  additionalDocuments: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  conditionsPriorToProjectInitiation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  complianceWithLaws: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  participationUnderOtherGHGPrograms: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  otherFormsOfCredit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sustainableDevelopment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  leakageManagement: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  commerciallySensitiveInfo: string;
}

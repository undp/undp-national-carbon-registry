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
import { ProjectScaleType } from "src/shared/src/enum/projectScaleType.enum";
import { ValidationReportLocationOfProjectActivity } from "./validationReportLocationOfProjectActivity.dto";

export class ValidationReportGHGDescription {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectTitle: string;

  @ApiProperty({ enum: ProjectScaleType })
  @IsNotEmpty()
  @IsEnum(ProjectScaleType, {
    message:
      "Invalid project size. Supported following project size:" +
      Object.values(ProjectScaleType),
  })
  projectSize: ProjectScaleType;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeEnergyIndustries: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeEnergyDistribution: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeEnergyDemand: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeManufacturingIndustries: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeChemicalIndustries: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeChemicalIndustry: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeConstruction: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeTransport: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeMining: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeFugitiveEmissionsFromFuel: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeFugitiveEmissionsFromHalocarbons: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeSolventsUse: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeWasteHandling: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeAfforestation: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isProjectScopeAgriculture: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  appliedMethodology: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  technicalAreas: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  creditingPeriod: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  startDateCreditingPeriod: number;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportLocationOfProjectActivity)
  locationsOfProjectActivity: ValidationReportLocationOfProjectActivity[];
}

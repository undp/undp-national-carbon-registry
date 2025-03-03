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
import { ValidationReportTeamMember } from "./validationReportTeamMember.dto";
import { ValidationReportFollowupInterview } from "./validationReportFollowupInterview.dto";
import { ValidationReportTypeOfFinding } from "../enum/validationReportTypeOfFinding.enum";
import { ValidationReportFinding } from "./validationReportFinding.dto";

export class ValidationReportMethodology {
  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportTeamMember)
  teamMembers: ValidationReportTeamMember[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cmaPublicReview: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  onsiteInspection: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportFollowupInterview)
  followupInterviews: ValidationReportFollowupInterview[];

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportFinding)
  validationReportFinding: ValidationReportFinding[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  generalDescriptionNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  generalDescriptionNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  generalDescriptionNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  involvedPartiesNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  involvedPartiesNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  involvedPartiesNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectSpecificationNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectSpecificationNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectSpecificationNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  startDateNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  startDateNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  startDateNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  technicalProjectDescriptionNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  technicalProjectDescriptionNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  technicalProjectDescriptionNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  contributionToSustainableDevelopmentNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  contributionToSustainableDevelopmentNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  contributionToSustainableDevelopmentNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  technologyEmployedNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  technologyEmployedNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  technologyEmployedNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  applicationOfMethodologyNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  applicationOfMethodologyNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  applicationOfMethodologyNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  baselineIdentificationNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  baselineIdentificationNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  baselineIdentificationNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  calculationOfGHGEmissionNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  calculationOfGHGEmissionNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  calculationOfGHGEmissionNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  additionalityDeterminationNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  additionalityDeterminationNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  additionalityDeterminationNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  monitoringMethodologyNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  monitoringMethodologyNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  monitoringMethodologyNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  monitoringPlanNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  monitoringPlanNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  monitoringPlanNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectManagementPlanningNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectManagementPlanningNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectManagementPlanningNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  durationOfProjectSpecificSection: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  durationOfProjectNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  durationOfProjectNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  durationOfProjectNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  environmentalImpactsSpecificSection: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  environmentalImpactsNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  environmentalImpactsNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  environmentalImpactsNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  stakeholderCommentsSpecificSection: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  stakeholderCommentsNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  stakeholderCommentsNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  stakeholderCommentsNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sumNoOfCAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sumNoOfCL: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sumNoOfFAR: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  finalValidation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  internalTechnicalReview: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  finalApproval: string;
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { CostQuotationAdditionalServiceDto } from "./costQuotationAdditionalService.dto";
import { ProjectTimelineDto } from "./projectTimeline.dto";
import { TeamMemberDto } from "./teamMember.dto";

export class ProjectProposalContentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  introduction: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  proposalNo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  dateOfIssue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  revNo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  durationOfService: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validityPeriodOfProposal: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  dateOfRevision: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectProponentName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectProponentContactPerson: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  projectProponentMobile: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  projectProponentEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  serviceProviderName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  serviceProviderContactPerson: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  serviceProviderMobile: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  serviceProviderTelephone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  serviceProviderEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  overallProjectBackground: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  proposalScope: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  developProjectConceptResponsible: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  notificationToSLCCSResponsible: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  prepareCMAResponsible: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  submissionOfCMAForValidationResponsible: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  preparationOfMonitoringReportResponsible: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  submissionOfMonitoringReportForVerificationResponsible: string;

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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectCapacityUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  plantFactorUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  avgEnergyOutputUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  gridEmissionFactorUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  emissionReductionUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  avgCreditGenerationPerAnnum: number;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProjectTimelineDto)
  projectTimeline: ProjectTimelineDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  scopeOfWork: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  teamComposition: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  teamMembers: TeamMemberDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  costing: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  costValidation: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  costVerification: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => CostQuotationAdditionalServiceDto)
  additionalServices: CostQuotationAdditionalServiceDto[];

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  executiveBoardMembers: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  slccsProjectDetails: string;
}

import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { CreditType } from "../enum/creditType.enum";
import { StakeholderInterviewDto } from "./stakeholderInterview.dto";

export class SiteVisitChecklistContentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  organizationName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  date: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  time: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  projectStartDate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  projectCommissionDate: number;

  @ApiProperty({ enum: CreditType })
  @IsNotEmpty()
  @IsEnum(CreditType, {
    message: "Invalid credit type. Supported following credit type:" + Object.values(CreditType),
  })
  projectTrack: CreditType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  projectCapacity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectFactor: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectEmission: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  leakageEmission: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  eligibility1YesNo: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eligibility1Comment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  eligibility2YesNo: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eligibility2Comment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  eligibility3YesNo: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eligibility3Comment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  eligibility4YesNo: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eligibility4Comment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  eligibility5YesNo: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eligibility5Comment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  eligibility6YesNo: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eligibility6Comment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc1FeasibilityStudiesAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc1FeasibilityStudiesComment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc2PowerPurchasingAgreementAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc2PowerPurchasingAgreementComment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc3TestingCertificateAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc3TestingCertificateComment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc4CalibrationReportsAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc4CalibrationReportsComment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc5DataManagementAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc5DataManagementComment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc6MonthlyElectricityRecordsAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc6MonthlyElectricityRecordsComment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc7MonthlyElectricityInvoicesAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc7MonthlyElectricityInvoicesComment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc8TrainingRecordsAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc8TrainingRecordsComment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  doc9InternalAuditReportsAvailability: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  doc9InternalAuditReportsComment: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StakeholderInterviewDto)
  stakeholderInterviews: StakeholderInterviewDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validatorName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validatorDesignation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  validationDate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validatorSignature: string;
}

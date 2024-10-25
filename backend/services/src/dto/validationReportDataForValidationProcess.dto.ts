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
import { ValidationReportEmployedTechnology } from "./validationReportEmployedTechnology.dto";
import { ValidationReportLocationWiseBaselineEmission } from "./validationReportLocationWiseBaselineEmission.dto";
import { ValidationReportNetEmissionReductions } from "./validationReportNetEmissionReductions.dto";

export class ValidationReportDataForValidationProcess {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  generalDescription: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportEmployedTechnology)
  employedTechnologies: ValidationReportEmployedTechnology[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalCapacity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  approvals: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicationOfMethodologyTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicationOfMethodologyApplicability: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria1ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria1Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria2ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria2Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria3ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria3Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria4ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria4Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria5ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria5Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria6ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria6Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria7ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria7Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria8ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria8Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria9ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria9Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicabilityCriteria10ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isApplicabilityCriteria10Met: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectBoundary: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  baselineIdentification: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  formulasUsedToDetermineEmissionReductions: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  calculationOfBaselineEmissionFactor: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  gridEmissionFactorValue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  gridEmissionFactorUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  plantFactor: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  annualEmissionReductionCalculation: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportLocationWiseBaselineEmission)
  baselineEmissions: ValidationReportLocationWiseBaselineEmission[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectEmission: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  leakageEmission: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ValidationReportNetEmissionReductions)
  estimatedNetEmissionReductions: ValidationReportNetEmissionReductions[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  methodologyDeviations: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  monitoringPlan: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  carbonManagementAssessment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  changesOfProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  environmentImpact: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  commentsOfStakeholders: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Appendix } from "./appendix.dto";
import { ValidationReportProjectDetails } from "./validationReportProjectDetails.dto";
import { ValidationReportIntroduction } from "./validationReportIntroduction.dto";
import { ValidationReportGHGDescription } from "./validationReportGHGDescription.dto";
import { ValidationReportMethodology } from "./validationReportMethodology.dto";
import { ValidationReportDataForValidationProcess } from "./validationReportDataForValidationProcess.dto";
import { ValidationReportValidationOpinion } from "./validationReportValidationOpinion.dto";
import { ValidationReportReferences } from "./validationReportReferences.dto";
import { ValidationReportAppendix } from "./validationReportAppendix.dto";

export class ValidationReportContentDto {
  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportProjectDetails)
  projectDetails: ValidationReportProjectDetails;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportIntroduction)
  introduction: ValidationReportIntroduction;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportGHGDescription)
  ghgProjectDescription: ValidationReportGHGDescription;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportMethodology)
  validationMethodology: ValidationReportMethodology;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportDataForValidationProcess)
  dataForValidationProcess: ValidationReportDataForValidationProcess;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportValidationOpinion)
  validationOpinion: ValidationReportValidationOpinion;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportReferences)
  references: ValidationReportReferences;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportAppendix)
  appendix: ValidationReportAppendix;
}

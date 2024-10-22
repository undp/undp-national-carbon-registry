import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ProjectDetails } from "./projectDetails.dto";
import { ProjectActivity } from "./projectActivity.dto";
import { EnvironmentImpacts } from "./environmentImpacts.dto";
import { LocalStakeholderConsultation } from "./localStakeholderConsultation.dto";
import { EligibilityCriteria } from "./eligibilityCriteria.dto";
import { ApplicationOfMethodology } from "./applicationOfMethodology.dto";
import { QuantificationOfGHG } from "./quantificationOfGHG.dto";
import { Monitoring } from "./monitoring.dto";
import { Appendix } from "./appendix.dto";

export class CMAContentDto {
  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ProjectDetails)
  projectDetails: ProjectDetails;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ProjectActivity)
  projectActivity: ProjectActivity;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => EnvironmentImpacts)
  environmentImpacts: EnvironmentImpacts;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => LocalStakeholderConsultation)
  localStakeholderConsultation: LocalStakeholderConsultation;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => EligibilityCriteria)
  eligibilityCriteria: EligibilityCriteria;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ApplicationOfMethodology)
  applicationOfMethodology: ApplicationOfMethodology;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => QuantificationOfGHG)
  quantificationOfGHG: QuantificationOfGHG;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => Monitoring)
  monitoring: Monitoring;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => Appendix)
  appendix: Appendix;
}

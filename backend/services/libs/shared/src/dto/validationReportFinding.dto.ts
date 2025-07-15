import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { ValidationReportConclusion } from "../enum/validationReportConclusion.enum";
import { ValidationReportTypeOfFinding } from "../enum/validationReportTypeOfFinding.enum";

export class ValidationReportFinding {
  @ApiProperty({ enum: ValidationReportTypeOfFinding })
  @IsNotEmpty()
  @IsEnum(ValidationReportTypeOfFinding, {
    message:
      "Invalid type of finding. Supported following type of finding:" +
      Object.values(ValidationReportTypeOfFinding),
  })
  typeOfFinding: ValidationReportTypeOfFinding;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  findingNo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  rfToCMA: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  actionRequestsByValidationTeam: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  summaryOfProjectOwnerResponse: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validationTeamAssessment: string;

  @ApiProperty({ enum: ValidationReportConclusion })
  @IsNotEmpty()
  @IsEnum(ValidationReportConclusion, {
    message:
      "Invalid conclusion type. Supported following conlusions:" +
      Object.values(ValidationReportConclusion),
  })
  conclusion: ValidationReportConclusion;
}

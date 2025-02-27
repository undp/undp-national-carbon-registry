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
import { ProjectScaleType } from "src/shared/src/enum/projectScaleType.enum";
import { ValidationReportLocationOfProjectActivity } from "./validationReportLocationOfProjectActivity.dto";
import { TeamMemberFunction } from "src/shared/src/enum/teamMemberFunction.enum";
import { TeamMemberTaskPerformed } from "src/shared/src/enum/teamMemberTaskPerformed.enum";

export class ValidationReportTeamMember {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ isArray: true, enum: TeamMemberFunction })
  @ArrayNotEmpty()
  @IsEnum(TeamMemberFunction, { each: true })
  function: TeamMemberFunction[];

  @ApiProperty({ isArray: true, enum: TeamMemberTaskPerformed })
  @ArrayNotEmpty()
  @IsEnum(TeamMemberTaskPerformed, { each: true })
  taskPerformed: TeamMemberTaskPerformed[];
}

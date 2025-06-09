import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ValidationReportContentDto } from "./validationReportContent.dto";

export class ValidationReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ValidationReportContentDto)
  content: ValidationReportContentDto;
}

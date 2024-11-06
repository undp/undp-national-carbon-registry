import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsString, ValidateIf } from "class-validator";

export class CNCertificateIssueDto {

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  verificationRequestId: number;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  approve: boolean;

  @ValidateIf(c => c.scope)
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  scope: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  orgBoundary: string;

  @ValidateIf(c => c.year)
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  year: number;

  @ValidateIf(c => c.assessmentPeriodStart)
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  assessmentPeriodStart: number;

  @ValidateIf(c => c.assessmentPeriodEnd)
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  assessmentPeriodEnd: number;
}

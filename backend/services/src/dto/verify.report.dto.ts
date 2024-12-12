import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsString, ValidateIf } from "class-validator";

export class VerifyReportDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  reportId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  verificationRequestId: number;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  verify: boolean;

  @ValidateIf(c => !c.verify)
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  remark: string;
}

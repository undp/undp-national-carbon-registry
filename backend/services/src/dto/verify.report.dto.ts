import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber } from "class-validator";

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
}

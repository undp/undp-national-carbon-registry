import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { RetirementStatusSl } from "../enum/retirementStatusSl.enum";

export class CreditRetirementStatusUpdateSlDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  requestId: string;

  @IsNotEmpty()
  @ApiProperty({ enum: RetirementStatusSl })
  @IsEnum(RetirementStatusSl, {
    message: "Invalid status. Supported following status:" + Object.values(RetirementStatusSl),
  })
  status: RetirementStatusSl;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment: string;
}

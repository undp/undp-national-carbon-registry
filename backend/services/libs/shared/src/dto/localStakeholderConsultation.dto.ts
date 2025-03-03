import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class LocalStakeholderConsultation {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  stakeholderConsultationProcess: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  summaryOfComments: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  considerationOfComments: string;
}

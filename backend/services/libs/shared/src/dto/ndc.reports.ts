import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
} from "class-validator";

export class NDCReports {

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  monitoringReport?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  verificationReport?: string;
}

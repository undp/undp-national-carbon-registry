import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class StatFilter {

  @ApiPropertyOptional()
  @IsOptional()
  onlyMine?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  startTime?: number;

  @ApiPropertyOptional()
  @IsOptional()
  endTime?: number;

  @ApiPropertyOptional()
  @IsOptional()
  timeGroup?: boolean;
}

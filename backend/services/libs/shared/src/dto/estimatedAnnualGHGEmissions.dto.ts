import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsPositive } from "class-validator";

export class EstimatedAnnualGHGEmissions {
  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  ghgEmissionReduction: number;
}

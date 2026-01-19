import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class MonitoredParameters {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  parameter: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  measurementMethods: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  frequency: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  valueApplied: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  monitoringEquipment: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  qaQCProcedures: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  purpose: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  calculationMethod: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comments: string;
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class EligibilityCriteria {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  generalCriteria411ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  generalCriteria411IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  generalCriteria412ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  generalCriteria412IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  generalCriteria413ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  generalCriteria413IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  generalCriteria414ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  generalCriteria414IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  generalCriteria415ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  generalCriteria415IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  generalCriteria416ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  generalCriteria416IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bundlingCriteria421ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  bundlingCriteria421IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bundlingCriteria422ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  bundlingCriteria422IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bundlingCriteria423ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  bundlingCriteria423IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bundlingCriteria424ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  bundlingCriteria424IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bundlingCriteria425ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  bundlingCriteria425IsAgreed: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bundlingCriteria426ProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  bundlingCriteria426IsAgreed: boolean;
}

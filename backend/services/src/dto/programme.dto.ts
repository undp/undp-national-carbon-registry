import { ApiProperty, ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { SectoralScope } from "@undp/serial-number-gen";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";
import { AgricultureProperties } from "./agriculture.properties";
import { SolarProperties } from "./solar.properties";
import { ProgrammeProperties } from "./programme.properties";
import { Sector } from "../enum/sector.enum";
import { Type } from "class-transformer";
import { MitigationProperties } from "./mitigation.properties";
import { NDCActionDto } from "./ndc.action.dto";
import { IsNumericLength } from "../util/validNumericLength.decorator";
import { IsNotPastDate } from "../util/isNotPastDate.decorator";

export class ProgrammeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  externalId: string;

  @ApiProperty({ enum: SectoralScope })
  @IsNotEmpty()
  @IsEnum(SectoralScope, {
    message:
      "Invalid sectoral scope. Supported following sectoral scope:" + Object.values(SectoralScope),
  })
  sectoralScope: SectoralScope;

  @ApiProperty({ enum: Sector })
  @IsNotEmpty()
  @IsEnum(Sector, {
    message: "Invalid sector. Supported following sector:" + Object.values(Sector),
  })
  sector: Sector;

  // @ApiProperty({ enum: TypeOfMitigation })
  // @IsEnum(TypeOfMitigation, {
  //     message: 'Invalid mitigation type. Supported following values:' + Object.values(TypeOfMitigation)
  // })
  // @IsNotEmpty()
  // typeOfMitigation: TypeOfMitigation;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  @IsNotPastDate()
  startTime: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  @IsNotPastDate()
  endTime: number;

  @ApiProperty()
  @IsNotEmpty({ each: true })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  proponentTaxVatId: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  article6trade?: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  article68trade?: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  article64trade?: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  article62trade?: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  mvcAdjust?: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  mvcUnadjusted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.article6trade === false)
  @IsArray()
  supportingowners?: string[];

  @ApiProperty()
  @ValidateIf((o) => o.article6trade === false)
  @IsNotEmpty()
  @IsString()
  implementinguser: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  proponentPercentage: number[];

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  creditUnit: string;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ProgrammeProperties)
  programmeProperties: ProgrammeProperties;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  projectLocation?: [];

  // @ApiProperty()
  // @ValidateIf(o => o.typeOfMitigation === TypeOfMitigation.AGRICULTURE)
  // @IsNotEmptyObject()
  // @ValidateNested()
  // @Type(() => AgricultureProperties)
  // agricultureProperties?: AgricultureProperties;

  // @ApiProperty()
  // @ValidateIf(o => o.typeOfMitigation === TypeOfMitigation.SOLAR)
  // @IsNotEmptyObject()
  // @ValidateNested()
  // @Type(() => SolarProperties)
  // solarProperties?: SolarProperties;

  // @ApiPropertyOptional({
  //     type: "array",
  //     items: {
  //         $ref: getSchemaPath(MitigationProperties),
  //     }
  // })
  // @IsOptional()
  // @ValidateNested({ each: true })
  // @Type(() => MitigationProperties)
  // mitigationActions?: MitigationProperties[]

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  @IsNumericLength(8, 2, {
    message:
      "Estimated credits must be a numeric value with up to 8 digits before and 2 digits after the decimal point",
  })
  creditEst: number;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => NDCActionDto)
  ndcAction?: NDCActionDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  designDocument?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  environmentalImpactAssessment?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  environmentalAssessmentRegistrationNo: string;
}

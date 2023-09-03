import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNotEmptyObject, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { NDCActionType } from "../enum/ndc.action.enum";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";
import { Type } from "class-transformer";
import { AgricultureProperties } from "./agriculture.properties";
import { SolarProperties } from "./solar.properties";
import { AdaptationProperties } from "./adaptation.properties";
import { NdcFinancing } from "./ndc.financing";
import { NDCReports } from "./ndc.reports";
import { CoBenefitsProperties } from "./co.benefits";
import { EnablementProperties } from "./enablement.properties";

export class NDCActionDto {

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  programmeId: string;

  @IsNotEmpty()
  @ApiProperty({ enum: NDCActionType })
  @IsEnum(NDCActionType, {
    message:
      "Invalid ndc action. Supported following roles:" + Object.values(NDCActionType),
  })
  action: NDCActionType;

  @ValidateIf((c) => c.action === NDCActionType.Mitigation)
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  methodology: string;

  @ApiProperty({ enum: TypeOfMitigation })
  @ValidateIf(o => o.action === NDCActionType.Mitigation || o.action === NDCActionType.CrossCutting)
  @IsEnum(TypeOfMitigation, {
      message: 'Invalid mitigation type. Supported following values:' + Object.values(TypeOfMitigation)
  })
  @IsNotEmpty()
  typeOfMitigation: TypeOfMitigation;


  @ApiProperty()
  @ValidateIf(o => o.typeOfMitigation === TypeOfMitigation.AGRICULTURE)
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => AgricultureProperties)
  agricultureProperties?: AgricultureProperties;

  @ApiProperty()
  @ValidateIf(o => o.typeOfMitigation === TypeOfMitigation.SOLAR)
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => SolarProperties)
  solarProperties?: SolarProperties;


  @ApiProperty()
  @ValidateIf(o => o.action === NDCActionType.Adaptation || o.ACADEMICS === NDCActionType.CrossCutting)
  @ValidateNested()
  @Type(() => AdaptationProperties)
  adaptationProperties: AdaptationProperties;

  
  @ApiPropertyOptional()
  @ValidateIf(o => o.action === NDCActionType.Mitigation || o.ACADEMICS === NDCActionType.CrossCutting)
  // @IsNotEmptyObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => NdcFinancing)
  ndcFinancing?: NdcFinancing;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  monitoringReport?: string;
  
  // @ApiPropertyOptional()
  // @ValidateNested()
  // @Type(() => NDCReports)
  // ndcReports?: NDCReports;


  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => CoBenefitsProperties)
  @IsOptional()
  coBenefitsProperties?: CoBenefitsProperties;

  @ApiPropertyOptional()
  @ValidateNested()
  @IsOptional()
  @Type(() => EnablementProperties)
  enablementProperties?: EnablementProperties;

  constantVersion: string;

  id?: string;

  externalId?: string;
}

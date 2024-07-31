import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNotEmptyObject, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { NDCActionType } from "../enum/ndc.action.enum";
import { SubTypeOfMitigation, TypeOfMitigation } from "../enum/typeofmitigation.enum";
import { Type } from "class-transformer";
import { AgricultureProperties } from "./agriculture.properties";
import { SolarProperties } from "./solar.properties";
import { AdaptationProperties } from "./adaptation.properties";
import { NdcFinancing } from "./ndc.financing";
import { NDCReports } from "./ndc.reports";
import { CoBenefitsProperties } from "./co.benefits";
import { EnablementProperties } from "./enablement.properties";
import { CreditCalculationProperties } from "./credit.calculation.properties";
import { CreditCalculationPropertyValidator, IsChildClassValid } from "../validation/credit.calculation.property.validator";

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

  @ApiProperty({ enum: SubTypeOfMitigation })
  @ValidateIf(o => ((o.action === NDCActionType.Mitigation || o.action === NDCActionType.CrossCutting) && (
    o.typeOfMitigation !== TypeOfMitigation.CCS && o.typeOfMitigation !== TypeOfMitigation.MARINE
  )))
  @IsEnum(SubTypeOfMitigation, {
      message: 'Invalid sub mitigation type. Supported following values:' + Object.values(SubTypeOfMitigation)
  })
  @IsNotEmpty()
  subTypeOfMitigation: SubTypeOfMitigation;


  @ApiProperty()
  @ValidateIf(o => o.typeOfMitigation === TypeOfMitigation.AGRICULTURE && o.subTypeOfMitigation === SubTypeOfMitigation.RICE_CROPS)
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => AgricultureProperties)
  agricultureProperties?: AgricultureProperties;

  @ApiProperty()
  @ValidateIf(o => o.typeOfMitigation === TypeOfMitigation.SOLAR && o.subTypeOfMitigation === SubTypeOfMitigation.SOLAR_PHOTOVOLTAICS_PV)
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => SolarProperties)
  solarProperties?: SolarProperties;

  @ApiProperty()
  @ValidateIf(o => o.subTypeOfMitigation === SubTypeOfMitigation.SOLAR_PHOTOVOLTAICS_PV 
    || o.subTypeOfMitigation === SubTypeOfMitigation.RICE_CROPS
    || o.subTypeOfMitigation === SubTypeOfMitigation.SOLAR_WATER_PUMPING_OFF_GRID
    || o.subTypeOfMitigation === SubTypeOfMitigation.SOLAR_WATER_PUMPING_ON_GRID
    || o.subTypeOfMitigation === SubTypeOfMitigation.SOIL_ENRICHMENT_BIOCHAR
    || o.subTypeOfMitigation === SubTypeOfMitigation.STOVES_HOUSES_IN_NAMIBIA
    )
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreditCalculationProperties)
  @IsChildClassValid()
  creditCalculationProperties?: CreditCalculationProperties;


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

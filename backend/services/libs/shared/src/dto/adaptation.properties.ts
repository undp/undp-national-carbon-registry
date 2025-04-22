import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { GhgEmissionDataProperties } from "./ghgEmission.properties";

export class AdaptationProperties {
    
    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    implementingAgency: string;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    nationalPlanObjectives: string;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    nationalPlanCoverage: string;
    
    @IsNotEmpty()
    @ApiProperty()
    ghgEmissionsAvoided: GhgEmissionDataProperties;
    
    @IsNotEmpty()
    @ApiProperty()
    ghgEmissionsReduced:GhgEmissionDataProperties;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    includedInNAP: boolean;
}
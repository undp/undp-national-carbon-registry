import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BuildingType } from "@undp/carbon-credit-calculator";
import { IsNotEmpty, IsPositive, IsNumber, IsEnum, IsOptional, IsString } from "class-validator";

export class NdcFinancing {
    
    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsNumber()
    userEstimatedCredits: number;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsNumber()
    systemEstimatedCredits: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    issuedCredits: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    availableCredits: number
}
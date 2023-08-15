import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BuildingType } from "@undp/carbon-credit-calculator";
import { IsNotEmpty, IsPositive, IsNumber, IsEnum, IsOptional, IsString } from "class-validator";

export class EnablementProperties {

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title: string;


    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    report?: string;
}
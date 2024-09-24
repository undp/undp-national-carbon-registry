import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { CreditCalculationProperties } from "./credit.calculation.properties";

export class SoilEnhancementBiocharProperties extends CreditCalculationProperties{
    
    @ApiProperty()
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    weight: number;

}
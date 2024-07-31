import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { CreditCalculationProperties } from "./credit.calculation.properties";

export class SolarWaterPumpOffGridProperties extends CreditCalculationProperties{
    
    @ApiProperty()
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    energyGeneration: number;

    @ApiProperty({default: "kWh/year/unit"})
    @IsNotEmpty()
    energyGenerationUnit: string;

}
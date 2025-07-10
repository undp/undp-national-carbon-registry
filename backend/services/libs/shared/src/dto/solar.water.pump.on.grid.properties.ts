import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { CreditCalculationProperties } from "./credit.calculation.properties";
import { EnergyGenerationUnits } from "../enum/energy.generation.units.enum";

export class SolarWaterPumpOnGridProperties extends CreditCalculationProperties{
    
    @ApiProperty()
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    energyGeneration: number;

    @ApiProperty({default: "kWh/year/unit", enum: EnergyGenerationUnits})
    @IsEnum(EnergyGenerationUnits, {
        message: 'Invalid energy generation unit. Supported following values:' + Object.values(EnergyGenerationUnits)
    })
    @IsNotEmpty()
    energyGenerationUnit: EnergyGenerationUnits;

}
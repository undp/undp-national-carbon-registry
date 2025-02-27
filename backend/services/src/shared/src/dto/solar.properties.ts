import { ApiProperty } from "@nestjs/swagger";
import { BuildingType } from "@undp/carbon-credit-calculator";
import { IsNotEmpty, IsPositive, IsNumber, IsEnum } from "class-validator";
import { MitigationProperties } from "./mitigation.properties";
import { EnergyGenerationUnits } from "../enum/energy.generation.units.enum";

export class SolarProperties {
    
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

    @ApiProperty({ enum: BuildingType })
    @IsEnum(BuildingType, {
        message: 'Invalid consumer group. Supported following values:' + Object.values(BuildingType)
    })
    consumerGroup: BuildingType;
}
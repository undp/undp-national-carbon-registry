import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";
import { SubTypeOfMitigation } from "../enum/typeofmitigation.enum";
import { EnergyGenerationUnits } from "../enum/energy.generation.units.enum";
import { LandAreaUnits } from "../enum/landAreaUnits.enum";

export class CreditCalculationProperties {
    
    @ApiProperty({ enum: TypeOfMitigation })
    @IsEnum(TypeOfMitigation, {
        message: 'Invalid mitigation type. Supported following values:' + Object.values(TypeOfMitigation)
    })
    typeOfMitigation: TypeOfMitigation;

    @ApiProperty({ enum: SubTypeOfMitigation })
    @IsEnum(SubTypeOfMitigation, {
        message: 'Invalid sub mitigation type. Supported following values:' + Object.values(SubTypeOfMitigation)
    })
    subTypeOfMitigation: SubTypeOfMitigation;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    energyGeneration?:number

    @ApiPropertyOptional({default: "kWh/year/unit", enum: EnergyGenerationUnits})
    @IsEnum(EnergyGenerationUnits, {
        message: 'Invalid energy generation unit. Supported following values:' + Object.values(EnergyGenerationUnits)
    })
    @IsOptional()
    energyGenerationUnit?: EnergyGenerationUnits;

    @ApiPropertyOptional()
    @IsOptional()
    @IsPositive()
    @IsNumber()
    landArea: number;

    @ApiPropertyOptional({default: "ha", enum: LandAreaUnits})
    @IsEnum(LandAreaUnits, {
        message: 'Invalid land area unit. Supported following values:' + Object.values(LandAreaUnits)
    })
    @IsOptional()
    landAreaUnit: LandAreaUnits;

}
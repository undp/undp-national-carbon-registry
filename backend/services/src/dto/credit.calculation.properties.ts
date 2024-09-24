import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional } from "class-validator";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";
import { SubTypeOfMitigation } from "../enum/typeofmitigation.enum";

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

    @IsOptional()
    @IsNumber()
    energyGeneration?:number
}
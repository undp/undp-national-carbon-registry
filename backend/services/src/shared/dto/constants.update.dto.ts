import { ApiProperty } from "@nestjs/swagger";
import { AgricultureConstants, SolarConstants } from "@undp/carbon-credit-calculator";
import { IsNotEmpty, IsEnum, ValidateIf, IsNotEmptyObject } from "class-validator";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";
import { AgricultureConstantsDto } from "./agriculture.constants.dto";
import { SolarConstantsDto } from "./solar.constants.dto";

export class ConstantUpdateDto {

    @ApiProperty({ enum: TypeOfMitigation })
    @IsEnum(TypeOfMitigation, {
        message: 'Invalid custom config group. Supported following values:' + Object.values(TypeOfMitigation)
    })
    @IsNotEmpty()
    type: TypeOfMitigation;

    @ApiProperty({ type: AgricultureConstantsDto })
    @IsNotEmptyObject()
    @ValidateIf(o => o.type === TypeOfMitigation.AGRICULTURE)
    @IsNotEmpty()
    agricultureConstants: AgricultureConstantsDto;

    @ApiProperty({ type: SolarConstantsDto })
    @IsNotEmptyObject()
    @ValidateIf(o => o.type === TypeOfMitigation.SOLAR)
    @IsNotEmpty()
    solarConstants: SolarConstantsDto;
}
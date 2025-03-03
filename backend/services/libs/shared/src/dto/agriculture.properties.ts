import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, IsEnum } from "class-validator";
import { MitigationProperties } from "./mitigation.properties";
import { LandAreaUnits } from "../enum/landAreaUnits.enum";

export class AgricultureProperties {

    @ApiProperty()
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    landArea: number;

    @ApiProperty({default: "ha", enum: LandAreaUnits})
    @IsEnum(LandAreaUnits, {
        message: 'Invalid land area unit. Supported following values:' + Object.values(LandAreaUnits)
    })
    @IsNotEmpty()
    landAreaUnit: LandAreaUnits;
}
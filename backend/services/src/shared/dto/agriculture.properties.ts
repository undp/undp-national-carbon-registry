import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString } from "class-validator";
import { MitigationProperties } from "./mitigation.properties";

export class AgricultureProperties extends MitigationProperties {

    @ApiProperty()
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    landArea: number;

    @ApiProperty({default: "ha"})
    @IsNotEmpty()
    @IsString()
    landAreaUnit: string;
}
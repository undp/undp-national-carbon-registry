import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString } from "class-validator";
import { CreditCalculationProperties } from "./credit.calculation.properties";

export class RiceCropsProperties extends CreditCalculationProperties {

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
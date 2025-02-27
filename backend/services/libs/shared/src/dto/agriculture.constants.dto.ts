import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class AgricultureConstantsDto {

    @ApiProperty()
    @IsNumber()
    emissionFactor: number;

    @ApiProperty()
    @IsString()
    emissionFactorUnit: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class SolarConstantsDto {

    @ApiProperty()
    @IsNumber()
    highEmissionFactor: number;

    @ApiProperty()
    @IsNumber()
    lowEmissionFactor: number;

    @ApiProperty()
    @IsString()
    emissionFactorUnit: string;

    @ApiProperty()
    @IsString()
    thresholdUnit: string;

    @ApiProperty({
        type: 'object',
        additionalProperties: {
            oneOf: [
                { type: 'number' }
            ]
        }
    })    
    buildingTypes: { [k: string]: number };
}
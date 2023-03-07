import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString } from "class-validator";

export class AgricultureProperties {

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
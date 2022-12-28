import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class FilterEntry {

    @IsNotEmpty()
    @ApiProperty()
    key: any;

    @IsNotEmpty()
    @ApiProperty()
    value: any;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    operation: any;
}
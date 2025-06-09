import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class FilterBy {

    @IsNotEmpty()
    @ApiPropertyOptional()
    @IsOptional()
    key: any;

    @IsNotEmpty()
    @ApiProperty()
    value: any[];
}
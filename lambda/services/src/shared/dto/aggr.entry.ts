import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class AggrEntry {

    @IsNotEmpty()
    @ApiPropertyOptional()
    @IsOptional()
    key: any;

    @IsNotEmpty()
    @IsString()
    @ApiPropertyOptional()
    @IsOptional()
    operation: any;

    constructor(key: any, operation: any) {
        this.key = key;
        this.operation = operation;
    }
}
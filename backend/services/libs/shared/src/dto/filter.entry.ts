import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class FilterEntry {

    @IsNotEmpty()
    @ApiPropertyOptional()
    @IsOptional()
    key: any;

    @IsNotEmpty()
    @ApiProperty()
    value: any;

    @IsNotEmpty()
    @IsString()
    @ApiPropertyOptional()
    @IsOptional()
    operation: any;

    @IsNotEmpty()
    @IsString()
    @ApiPropertyOptional()
    @IsOptional()
    keyOperation?: any;

    // @IsNotEmpty()
    // @IsString()
    // @ApiPropertyOptional()
    // @IsOptional()
    // keyOperationAttr?: any;
}
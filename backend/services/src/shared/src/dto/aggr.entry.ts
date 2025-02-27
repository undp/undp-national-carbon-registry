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

    @IsNotEmpty()
    @IsString()
    @ApiPropertyOptional()
    @IsOptional()
    fieldName: string;

    @IsNotEmpty()
    @IsString()
    @ApiPropertyOptional()
    @IsOptional()
    outerQuery?: string;

    @IsNotEmpty()
    @IsString()
    @ApiPropertyOptional()
    @IsOptional()
    mineCompanyId?: boolean;

    // @IsNotEmpty()
    // @IsString()
    // @ApiPropertyOptional()
    // @IsOptional()
    // keyOperation?: any;

    // @IsNotEmpty()
    // @IsString()
    // @ApiPropertyOptional()
    // @IsOptional()
    // keyOperationAttr?: any;

    constructor(key: any, operation: any, fieldName: string) {
        this.key = key;
        this.operation = operation;
        this.fieldName = fieldName;
    }
}
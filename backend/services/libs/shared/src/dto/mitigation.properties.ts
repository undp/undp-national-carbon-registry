import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsEnum, IsOptional, IsNumber, IsString } from "class-validator";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";

export class MitigationProperties {
    
    @ApiProperty({ enum: TypeOfMitigation })
    @IsEnum(TypeOfMitigation, {
        message: 'Invalid mitigation type. Supported following values:' + Object.values(TypeOfMitigation)
    })
    @IsNotEmpty()
    typeOfMitigation: TypeOfMitigation;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsNumber()
    userEstimatedCredits: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    systemEstimatedCredits: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    actionId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty()
    projectMaterial?: any[];

    @ApiPropertyOptional()
    @IsOptional()
    properties: any;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    constantVersion: string;
}
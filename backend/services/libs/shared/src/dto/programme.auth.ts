import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length, IsOptional, Min } from "class-validator";

export class ProgrammeAuth {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    externalId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    serialNo: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Min(0)
    issueAmount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    authOrganisationName: string;
}
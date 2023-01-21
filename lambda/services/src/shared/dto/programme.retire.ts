import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from "class-validator";

export class ProgrammeRetire {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiPropertyOptional()
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    fromCompanyIds: number[];

    @ApiPropertyOptional()
    @IsArray()
    @IsNumber({},{each: true})
    @Min(0, { each: true })
    @IsOptional()
    companyCredit: number[];

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsNotEmpty()
    @IsOptional()
    toAccount: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;
}
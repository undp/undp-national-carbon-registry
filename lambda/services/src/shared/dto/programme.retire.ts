import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from "class-validator";
import { BasicCompany } from "./BasicCompany.dto";

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
    @IsNotEmpty()
    @IsNotEmpty()
    @IsOptional()
    toCompanyMeta: BasicCompany;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;
}
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, Min } from "class-validator";

export class ProgrammeTransferApprove {

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    requestId: number;

    @ApiPropertyOptional()
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    companyIds: number[];

    @ApiPropertyOptional()
    @IsArray()
    @IsNumber({},{each: true})
    @Min(0, { each: true })
    @IsOptional()
    companyCredit: number[];

    @ApiProperty()
    @IsString()
    @Length(0, 200)
    comment: string;
}
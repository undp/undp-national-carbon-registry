import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length, IsOptional, Min, IsObject, ValidateNested } from "class-validator";
import { mitigationIssueProperties } from "./mitigation.issue.properties";

export class ProgrammeMitigationIssue {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiProperty()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => mitigationIssueProperties)
    issueAmount: mitigationIssueProperties[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    externalId?: string;
}
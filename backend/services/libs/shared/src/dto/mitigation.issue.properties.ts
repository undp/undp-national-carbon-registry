import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from "class-validator";

export class mitigationIssueProperties{
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    actionId: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    issueCredit: number;
}
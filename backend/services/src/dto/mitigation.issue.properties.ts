import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class mitigationIssueProperties{
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    actionId: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    issueCredit: number;
}
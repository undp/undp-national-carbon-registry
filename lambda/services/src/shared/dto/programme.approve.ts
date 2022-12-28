import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length } from "class-validator";

export class ProgrammeApprove {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiProperty()
    @IsString()
    @Length(0, 200)
    comment: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString, Length } from "class-validator";

export class ProgrammeTransferRequest {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiProperty()
    @IsPositive()
    @IsNumber()
    creditAmount: number;

    @ApiProperty()
    @IsString()
    @Length(0, 200)
    comment: string;
}
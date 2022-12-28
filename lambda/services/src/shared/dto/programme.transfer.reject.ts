import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length } from "class-validator";

export class ProgrammeTransferReject {

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    requestId: number;

    @ApiProperty()
    @IsString()
    @Length(0, 200)
    comment: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ProgrammeStage } from "../programme-ledger/programme-status.enum";

export class ProgrammeIdDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    serial: string;
}
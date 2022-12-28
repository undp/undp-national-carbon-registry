import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ProgrammeStage } from "../programme-ledger/programme-status.enum";

export class DataListResponseDto {
    data: any[];
    total: number;

    constructor(data: any[], total: number) {
        this.total = total;
        this.data = data
    }
}
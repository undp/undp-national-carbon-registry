import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ProgrammeStage } from "../enum/programme-status.enum";

export class QldbMetadata {
    id: string;
    version: number;
    txTime: string;
}
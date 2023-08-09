import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Programme } from "../entities/programme.entity";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { QldbMetadata } from "./qldb.metadata";

export class ProgrammeHistoryDto {
    metadata: QldbMetadata;
    data: Programme
}
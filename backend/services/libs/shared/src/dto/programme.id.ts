import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ProgrammeStage } from "../enum/programme-status.enum";

export class ProgrammeIdDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  serial: string;
}

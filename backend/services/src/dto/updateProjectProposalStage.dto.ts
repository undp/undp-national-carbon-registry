import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CMAContentDto } from "./cmaContent.dto";
import { TxType } from "../enum/txtype.enum";

export class UpdateProjectProposalStageDto {
  programmeId: string;
  txType: TxType;
}

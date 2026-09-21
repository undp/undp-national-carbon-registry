import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreditBlockHistoryRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  blockId: string;
}

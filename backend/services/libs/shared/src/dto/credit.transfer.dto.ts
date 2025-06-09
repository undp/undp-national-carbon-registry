import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class CreditTransferDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  receiverOrgId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  blockId: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  amount: number;
}

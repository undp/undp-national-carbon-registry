import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class CreditTransferDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  receiverCompanyId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  creditBlockId: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  amount: number;
}

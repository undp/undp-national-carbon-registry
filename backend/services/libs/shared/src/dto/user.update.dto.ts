import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from "class-validator";

export class UserUpdateDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  id: number;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.phoneNo !== "")
  @IsPhoneNumber(null, { message: "Invalid phone number format." })
  @ApiPropertyOptional()
  phoneNo: string;
}

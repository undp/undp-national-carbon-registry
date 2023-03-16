import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsString,
} from "class-validator";

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PasswordResetDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  newPassword: string;
}

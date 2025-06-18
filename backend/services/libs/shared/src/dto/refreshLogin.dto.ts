import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshLoginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  refreshToken: string;
}

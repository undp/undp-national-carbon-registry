import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PasswordUpdateDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    newPassword: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    oldPassword: string;
}
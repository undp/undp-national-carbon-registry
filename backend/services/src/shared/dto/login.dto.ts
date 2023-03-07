import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, isNotEmpty, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    username: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    password: string;
}
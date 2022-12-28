import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, isNotEmpty, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Role } from "../casl/role.enum";

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
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty()
    phoneNo: string;
}


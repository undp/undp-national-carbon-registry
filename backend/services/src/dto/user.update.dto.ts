import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
    @IsOptional()
    @ApiPropertyOptional()
    phoneNo: string;

    @IsOptional()
    @IsEmail()
    @ApiPropertyOptional()
    email: string;

    @IsOptional()
    @ApiPropertyOptional({ enum: Role })
    @IsEnum(Role, {
        message: 'Invalid role. Supported following roles:' + Object.values(Role)
    })
    role: Role;
}


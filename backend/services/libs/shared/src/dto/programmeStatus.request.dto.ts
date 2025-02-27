import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class programmeStatusRequestDto {
  type: any;
  value?: string;
  companyId?: any;
  startTime?: any;
  endTime?: any;
}

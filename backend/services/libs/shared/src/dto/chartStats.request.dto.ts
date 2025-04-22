import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class chartStatsRequestDto {
  type: string;
  value?: string;
  companyId?: any;
  startDate?: number;
  endDate?: number;
}

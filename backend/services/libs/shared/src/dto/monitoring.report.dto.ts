import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class MonitoringReportDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  programmeId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  content: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

// Attaches or detaches one cooperative approach on an initial report.
// Attaching an approach to an already-submitted report is what opens the
// next major version, so this is deliberately its own endpoint rather
// than a field on the update DTO.
export class InitialReportCooperativeApproachDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reportNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cooperativeApproachId: string;
}

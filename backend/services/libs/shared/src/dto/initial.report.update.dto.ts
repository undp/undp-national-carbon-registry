import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { InitialReportCreateDto } from "./initial.report.create.dto";

// Edits the live report row in place. Cooperative approaches are not
// editable here — they go through the dedicated add/remove endpoints, so
// that adding one can drive the version bump.
export class InitialReportUpdateDto extends InitialReportCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reportNumber: string;
}

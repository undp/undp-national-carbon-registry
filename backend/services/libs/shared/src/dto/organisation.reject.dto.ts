import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class OrganisationRejectDto {
  @ApiProperty()
  @IsString()
  remarks: string;
}

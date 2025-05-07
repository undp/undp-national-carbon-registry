import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class OrganisationRejectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  remarks: string;
}

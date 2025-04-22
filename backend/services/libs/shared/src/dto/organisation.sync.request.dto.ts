import { IsNotEmpty } from "class-validator";
import { OrganisationUpdateDto } from "./organisation.update.dto";
import { ApiProperty } from "@nestjs/swagger";

export class OrganisationSyncRequestDto {
    @IsNotEmpty()
    @ApiProperty()
    organizationIdentifierId: string;

    organisationUpdateDto: OrganisationUpdateDto;
}
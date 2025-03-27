import { ProjectSectorEnum } from '../enum/project.sector.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ProjectDataRequestDTO {
    @ApiProperty()
    @IsOptional()
    isMine?: boolean = false;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    startDate?: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    endDate?: number;

    @ApiProperty({
        enum: ProjectSectorEnum,
    })
    @IsOptional()
    sector?: ProjectSectorEnum;
}

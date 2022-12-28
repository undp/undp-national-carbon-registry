import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { EntitySubject } from "../entities/entity.subject";
import { StatType } from "../enum/stat.type.enum";

export class Stat extends EntitySubject {
    
    @ApiProperty({ enum: StatType })
    @IsEnum(StatType, {
        message: 'Invalid stat type. Support following values:' + Object.values(StatType)
    })
    type: StatType;

    data?: any;
}
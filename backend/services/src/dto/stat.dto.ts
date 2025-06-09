import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum } from "class-validator";
import { EntitySubject } from "../entities/entity.subject";
import { StatType } from "../enum/stat.type.enum";
import { StatFilter } from "./stat.filter";

export class Stat extends EntitySubject {
  @ApiProperty({ enum: StatType })
  @IsEnum(StatType, {
    message:
      "Invalid stat type. Support following values:" + Object.values(StatType),
  })
  type: StatType;
  value?: any;
  data?: any;

  key?: string;

  @ApiPropertyOptional()
  @Type(() => StatFilter)
  statFilter: StatFilter;
}

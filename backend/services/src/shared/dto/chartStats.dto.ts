import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { EntitySubject } from "../entities/entity.subject";
import { ChartType } from "../enum/chart.type.enum";

export class ChartStat extends EntitySubject {
  @ApiProperty({ enum: ChartType })
  @IsEnum(ChartType, {
    message:
      "Invalid stat type. Support following values:" + Object.values(ChartType),
  })
  type: ChartType;
  value?: any;
  data?: any;
}

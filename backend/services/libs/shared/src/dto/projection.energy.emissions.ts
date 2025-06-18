import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectionCarbonDioxideTransportStorage } from './projection.carbon.dioxide.transport.storage';
import { ProjectionFuelCombustionActivities } from './projection.fuel.combustion.activities';
import { ProjectionFugitiveEmissionsFromFuels } from './projection.fugitive.emissions.from.fuels';

export class ProjectionEnergyEmissions {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionFuelCombustionActivities)
  fuelCombustionActivities: ProjectionFuelCombustionActivities;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionFugitiveEmissionsFromFuels)
  fugitiveEmissionsFromFuels: ProjectionFugitiveEmissionsFromFuels;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionCarbonDioxideTransportStorage)
  carbonDioxideTransportStorage: ProjectionCarbonDioxideTransportStorage;
}

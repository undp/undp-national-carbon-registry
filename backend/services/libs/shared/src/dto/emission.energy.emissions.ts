import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EmissionFuelCombustionActivities } from './emission.fuel.combustion.activities';
import { EmissionFugitiveEmissionsFromFuels } from './emission.fugitive.emissions.from.fuels';
import { EmissionCarbonDioxideTransportStorage } from './emission.carbon.dioxide.transport.storage';

export class EmissionEnergyEmissions {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionFuelCombustionActivities)
  fuelCombustionActivities: EmissionFuelCombustionActivities;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionFugitiveEmissionsFromFuels)
  fugitiveEmissionsFromFuels: EmissionFugitiveEmissionsFromFuels;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionCarbonDioxideTransportStorage)
  carbonDioxideTransportStorage: EmissionCarbonDioxideTransportStorage;
}

import { GHGRecordState } from '../Enums/ghg.record.state.enum';
import { BaseEntity } from './baseEntity';

export class Projection implements BaseEntity {
  id?: string;

  year?: string;
  // energyEmissions?: EmissionEnergyEmissions;
  // industrialProcessesProductUse?: EmissionIndustrialProcessesProductUse;

  // agricultureForestryOtherLandUse?: EmissionAgricultureForestryOtherLandUse;
  // waste?: EmissionWaste;
  // other?: EmissionOther;
  // totalCo2WithoutLand?: EmissionProperties;
  // totalCo2WithLand?: EmissionProperties;
  state?: GHGRecordState;

  emissionDocument?: string;

  version?: number;
}

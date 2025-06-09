import { Entity, Column, Unique, PrimaryGeneratedColumn } from 'typeorm';
import { EntitySubject } from './entity.subject';
import { EmissionEnergyEmissions } from '../dto/emission.energy.emissions';
import { EmissionIndustrialProcessesProductUse } from '../dto/emission.industrial.processes.product.use';
import { EmissionAgricultureForestryOtherLandUse } from '../dto/emission.agriculture.forestry.other.land.use';
import { EmissionWaste } from '../dto/emission.waste';
import { EmissionOther } from '../dto/emission.other';
import { EmissionProperties } from '../dto/emission.properties';
import { GHGRecordState } from '../enum/ghg.record.state.enum';

@Entity()
@Unique(['year', 'country'])
export class Emission implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: false })
  country: string;

  @Column({ nullable: false })
  year: string;

  @Column({
    type: 'jsonb',
    array: false,
    nullable: true,
  })
  energyEmissions?: EmissionEnergyEmissions;

  @Column('jsonb', { array: false, nullable: true })
  industrialProcessesProductUse?: EmissionIndustrialProcessesProductUse;

  @Column('jsonb', { array: false, nullable: true })
  agricultureForestryOtherLandUse?: EmissionAgricultureForestryOtherLandUse;

  @Column('jsonb', { array: false, nullable: true })
  waste?: EmissionWaste;

  @Column('jsonb', { array: false, nullable: true })
  other?: EmissionOther;

  @Column('jsonb', { array: false, nullable: true })
  totalCo2WithoutLand?: EmissionProperties;

  @Column('jsonb', { array: false, nullable: true })
  totalCo2WithLand?: EmissionProperties;

  @Column({
    type: 'enum',
    enum: GHGRecordState,
    array: false,
  })
  state: GHGRecordState;

  @Column({ nullable: true })
  emissionDocument: string;

  @Column({ nullable: false })
  version: number;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  updatedAt: Date;

  @Column({ nullable: true })
  remarks: string;
}

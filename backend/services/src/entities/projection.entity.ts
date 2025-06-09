import { Entity, Column, Unique, PrimaryGeneratedColumn } from 'typeorm';
import { EntitySubject } from './entity.subject';
import { GHGRecordState } from '../enum/ghg.record.state.enum';
import { ProjectionAgricultureForestryOtherLandUse } from '../dto/projection.agriculture.forestry.other.land.use';
import { ProjectionEnergyEmissions } from '../dto/projection.energy.emissions';
import { ProjectionIndustrialProcessesProductUse } from '../dto/projection.industrial.processes.product.use';
import { ProjectionOther } from '../dto/projection.other';
import { ProjectionProperties } from '../dto/projection.properties';
import { ProjectionWaste } from '../dto/projection.waste';

@Entity()
@Unique(['year', 'country'])
export class Projection implements EntitySubject {
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
  energyEmissions?: ProjectionEnergyEmissions;

  @Column('jsonb', { array: false, nullable: true })
  industrialProcessesProductUse?: ProjectionIndustrialProcessesProductUse;

  @Column('jsonb', { array: false, nullable: true })
  agricultureForestryOtherLandUse?: ProjectionAgricultureForestryOtherLandUse;

  @Column('jsonb', { array: false, nullable: true })
  waste?: ProjectionWaste;

  @Column('jsonb', { array: false, nullable: true })
  other?: ProjectionOther;

  @Column('jsonb', { array: false, nullable: true })
  totalCo2WithoutLand?: ProjectionProperties;

  @Column('jsonb', { array: false, nullable: true })
  totalCo2WithLand?: ProjectionProperties;

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

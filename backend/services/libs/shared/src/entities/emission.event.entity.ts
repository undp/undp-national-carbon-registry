import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { EntitySubject } from './entity.subject';

@Entity()
export class EmissionEvent implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: false })
  emissionId: string;

  @Column({ nullable: false })
  year: string;

  @Column({
    type: 'jsonb',
    array: false,
    nullable: true,
  })
  eventData?: any;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt: Date;

  @Column({ nullable: false })
  createdBy: number;
}

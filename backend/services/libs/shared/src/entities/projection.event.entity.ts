import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { EntitySubject } from './entity.subject';

@Entity()
export class ProjectionEvent implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: false })
  projectionId: string;

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

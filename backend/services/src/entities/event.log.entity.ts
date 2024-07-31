import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { EntitySubject } from './entity.subject';
import { EventLogType } from '../enum/event.log.type.enum';

@Entity()
export class EventLog implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({
    type: "enum",
    enum: EventLogType,
    array: false,
    nullable: false
  })
  type: EventLogType;

  @Column({
    type: 'jsonb',
    array: false,
    nullable: true,
  })
  eventData?: any;

  @Column({ type: "bigint", nullable: false })
  createdTime: number;

  @Column({ nullable: true })
  createdBy: number;
}

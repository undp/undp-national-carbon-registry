import { Column, Entity, PrimaryColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";

@Entity()
export class MonitoringReportEntity implements EntitySubject {
  @PrimaryColumn()
  id: number;

  @Column()
  programmeId: string;
}

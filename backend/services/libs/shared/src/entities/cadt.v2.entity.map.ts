import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("cadt_v2_entity_map")
@Unique(["cadtEntityType", "localEntityId"])
export class CadtV2EntityMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cadtEntityType: string;

  @Column()
  localEntityId: string;

  @Column()
  cadtUuid: string;

  @Column({ type: "bigint" })
  lastSyncedAt: number;

  @Column({ nullable: true })
  syncStatus: string;
}

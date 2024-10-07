import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Province {
  @PrimaryColumn()
  key: string;

  @Column()
  countryAlpha2: string;

  @Column()
  provinceName: string;

  @Column()
  lang: string;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  geoCoordinates: any;
}

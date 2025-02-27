import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class DSDivision {
  @PrimaryColumn()
  key: string;

  @Column()
  countryAlpha2: string;

  @Column()
  divisionName: string;

  @Column()
  districtName: string;

  @Column()
  lang: string;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  geoCoordinates: any;
}

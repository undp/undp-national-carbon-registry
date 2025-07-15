import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class City {
  @PrimaryColumn()
  key: string;

  @Column()
  countryAlpha2: string;

  @Column()
  cityName: string;

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

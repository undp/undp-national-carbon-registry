import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Country {

    @PrimaryColumn()
    alpha2: string;

    @Column()
    alpha3: string;

    @Column()
    name: string

}
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class NdcDetailsPeriod {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    startYear: number;

    @Column()
    endYear: number;

    @Column()
    finalized: boolean

    @Column('boolean', { default: false })
    deleted: boolean
}
import { SubSectorConstants } from "@undp/carbon-credit-calculator";
import { Column, Entity, Generated, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";

@Entity()
export class ConstantEntity {

    @PrimaryColumn({
        type: "enum",
        enum: TypeOfMitigation,
        array: false
    })
    id: TypeOfMitigation;

    @PrimaryGeneratedColumn('increment')
    version: number;

    @Column({
        type: 'jsonb',
        array: false,
        nullable: true
    })
    data: SubSectorConstants;

}
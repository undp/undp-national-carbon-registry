import { Column, Entity, PrimaryColumn } from "typeorm";
import { CounterType } from "../util/counter.type.enum";

@Entity()
export class Counter {

    @PrimaryColumn({
        type: "enum",
        enum: CounterType,
        array: false
    })
    id: CounterType;

    @Column({ default: 0 })
    counter: number;

}
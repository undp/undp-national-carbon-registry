import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { asyncActionType } from "../enum/async.action.type.enum";
import { EntitySubject } from "./entity.subject";

@Entity()
export class AsyncActionEntity {
    @PrimaryGeneratedColumn()
    actionId: number;

    @Column({
        type: "enum",
        enum: asyncActionType,
        array: false
    })
    actionType: asyncActionType;

    @Column()
    actionProps: string;
}
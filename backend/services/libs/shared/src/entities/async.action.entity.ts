import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AsyncActionType } from "../enum/async.action.type.enum";

@Entity()
export class AsyncActionEntity {
    @PrimaryGeneratedColumn()
    actionId: number;

    @Column({
        type: "enum",
        enum: AsyncActionType,
        array: false
    })
    actionType: AsyncActionType;

    @Column()
    actionProps: string;
}
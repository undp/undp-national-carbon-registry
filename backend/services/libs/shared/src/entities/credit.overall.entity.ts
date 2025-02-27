import { PRECISION } from '@undp/carbon-credit-calculator/dist/esm/calculator';
import { Entity, Column, PrimaryColumn } from 'typeorm';
import { TxType } from '../enum/txtype.enum';
import { EntitySubject } from './entity.subject';

@Entity()
export class CreditOverall implements EntitySubject {

    @PrimaryColumn()
    txId: string;

    @Column()
    txRef: string;

    @Column({
        type: "enum",
        enum: TxType,
        array: false
    })
    txType: TxType;

    @Column({type: "decimal", precision: 10, scale: PRECISION})
    credit: number;
}

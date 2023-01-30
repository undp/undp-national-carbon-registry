import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { CompanyRole } from "../enum/company.role.enum";
import { CompanyState } from "../enum/company.state.enum";
import { EntitySubject } from "./entity.subject";

@Entity()
export class Company implements EntitySubject{

    @PrimaryColumn()
    companyId: number;

    @Column({ unique: true, nullable: true })
    taxId: string;

    @Column()
    name: string;

    @Column({ unique: true, nullable: true})
    email: string;

    @Column({nullable: true})
    phoneNo: string;

    @Column({nullable: true})
    website: string;

    @Column({nullable: true})
    address: string;

    @Column({nullable: true})
    logo: string;

    @Column({nullable: true})
    country: string;

    @Column({
        type: "enum",
        enum: CompanyRole,
        array: false
    })
    companyRole: CompanyRole;

    @Column({
        type: "enum",
        enum: CompanyState,
        array: false,
        default: CompanyState.ACTIVE
    })
    state: CompanyState;

    @Column("real", { nullable: true })
    creditBalance: number;

    @Column({
        type: 'jsonb',
        array: false,
        nullable: true
    })
    secondaryAccountBalance: any;

    @Column("bigint", { nullable: true })
    programmeCount: number;

    @Column("bigint", { nullable: true })
    lastUpdateVersion: number;

    @Column({nullable:true})
    remarks: string;

    @Column({type: "bigint", nullable: true})
    createdTime: number;

}
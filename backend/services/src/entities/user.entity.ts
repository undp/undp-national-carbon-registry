import { Role } from '../casl/role.enum';
import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne, OneToMany, ManyToOne } from 'typeorm';
import { EntitySubject } from './entity.subject';
import { CompanyRole } from '../enum/company.role.enum';
import { Company } from './company.entity';

@Entity()
export class User  implements EntitySubject{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({select: false})
    password: string;

    @Column({
        type: "enum",
        enum: Role,
        array: false,
        default: Role.ViewOnly
    })
    role: Role;

    @Column()
    name: string;

    @Column()
    country: string;

    @Column({nullable: true})
    phoneNo: string;

    @Column({nullable: true})
    companyId: number;

    // @ManyToOne(() => Company, (company) => company.companyId)
    // @JoinColumn({name: "companyId"})
    // company: Company | null;

    @Column({
        type: "enum",
        enum: CompanyRole,
        array: false,
        default: CompanyRole.PROGRAMME_DEVELOPER
    })
    companyRole: CompanyRole;

    @Column({nullable: true, select: false})
    apiKey: string;

    @Column({type: "bigint", nullable: true})
    createdTime: number;

    companyState: number;

    @Column({type: "boolean", nullable: false, default: false})
    isPending: boolean;
}

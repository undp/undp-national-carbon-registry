import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ProjectAuditLogType } from '../enum/project.audit.log.type.enum';

@Entity()
export class AuditEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    refId: string;

    @Column({
        type: 'enum',
        enum: ProjectAuditLogType,
        array: false,
        nullable: true,
    })
    logType: ProjectAuditLogType;

    @Column({
        type: 'jsonb',
        array: false,
        nullable: true,
    })
    data: any;

    @Column({ nullable: true })
    userId: number;

    @Column({ type: 'bigint', nullable: false })
    createdTime: number;

    @BeforeInsert()
    async createTime() {
        this.createdTime = new Date().getTime();
    }
}

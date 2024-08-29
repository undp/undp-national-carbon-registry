import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { EntitySubject } from './entity.subject';
import { CreditAuditLogType } from 'src/enum/credit.audit.log.type.enum';
import { PRECISION } from '@undp/carbon-credit-calculator/dist/esm/calculator';

@Entity()
export class CreditAuditLog implements EntitySubject {
	@PrimaryGeneratedColumn()
	id: string;

	@Column({
		array: false,
		nullable: false,
	})
	programmeId: string;

	@Column({
		type: "enum",
		enum: CreditAuditLogType,
		array: false,
		nullable: false
	})
	type: CreditAuditLogType;

	@Column({ nullable: true })
	country: string;

	@Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
	credits: number;

	@CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdTime: Date;

	@Column({ nullable: false })
	createdBy: number;
}

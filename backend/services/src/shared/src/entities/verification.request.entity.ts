import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { VerificationRequestStatusEnum } from "src/shared/src/enum/verification.request.status.enum";
import { PRECISION } from "@undp/carbon-credit-calculator/dist/esm/calculator";

@Entity()
export class VerificationRequestEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  programmeId: string;

  @Column()
  userId: number;

  @Column({
    type: "enum",
    enum: VerificationRequestStatusEnum,
  })
  status: VerificationRequestStatusEnum;

  @Column({ type: "decimal", precision: 10, scale: PRECISION, nullable: true })
  creditAmount: number;

  @Column({ nullable: true })
  verificationSerialNo: string;

  @Column({ type: "bigint", nullable: true })
  monitoringStartDate: number;

  @Column({ type: "bigint", nullable: true })
  monitoringEndDate: number;

  @Column({ nullable: true })
  creditIssueCertificateUrl: string;

  @Column({ nullable: true })
  carbonNeutralCertificateSerialNo: string;

  @Column({ nullable: false, default: false })
  carbonNeutralCertificateRequested: boolean;

  @Column({ nullable: true })
  carbonNeutralCertificateUrl: string;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;
}

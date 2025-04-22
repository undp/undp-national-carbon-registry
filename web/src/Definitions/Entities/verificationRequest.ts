import { VerificationRequestStatusEnum } from '../Enums/verification.request.status.enum';
import { BaseEntity } from './baseEntity';

export class VerificationRequest implements BaseEntity {
  id!: number;

  programmeId!: string;

  userId!: number;

  status!: VerificationRequestStatusEnum;

  creditAmount?: number;

  verificationSerialNo?: string;

  monitoringStartDate?: number;

  monitoringEndDate?: number;

  creditIssueCertificateUrl?: string;

  carbonNeutralCertificateRequested!: boolean;

  carbonNeutralCertificateUrl?: string;

  createdTime!: number;

  updatedTime?: number;
}

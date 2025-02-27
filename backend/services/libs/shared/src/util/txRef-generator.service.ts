import { Injectable } from "@nestjs/common";
import { Company } from "../entities/company.entity";
import { CreditRetirementSl } from "../entities/creditRetirementSl.entity";
import { User } from "../entities/user.entity";
import { ProgrammeSl } from "../entities/programmeSl.entity";
import { VerificationRequestEntity } from "../entities/verification.request.entity";

@Injectable()
export class TxRefGeneratorService {
  public getCreditTransferRequestApproveRef(
    user: User,
    userCompany: Company,
    fromCompany: Company,
    toCompany: Company,
    retireRequest: CreditRetirementSl
  ): string {
    const parts = [
      user.companyId,
      userCompany.name,
      user.id,
      fromCompany?.companyId || "N/A",
      fromCompany?.name || "N/A",
      toCompany?.companyId || fromCompany.companyId,
      toCompany?.name || fromCompany?.name,
      retireRequest.requestId,
      retireRequest.creditType,
      retireRequest.comment,
      retireRequest.creditAmount,
    ];
    return parts.filter((part) => part).join("#"); // Join all parts with '#' ensuring no unwanted spaces or line breaks
  }

  public getCreditIssueApproveRef(
    user: User,
    programme: ProgrammeSl,
    verificationRequest: VerificationRequestEntity
  ): string {
    const parts = [
      user.companyId,
      user.id,
      programme.programmeId,
      programme.title,
      programme.companyId,
      verificationRequest.id,
      programme.purposeOfCreditDevelopment, //credit type
      // retireRequest.comment,
      verificationRequest.creditAmount,
    ];
    return parts.filter((part) => part).join("#"); // Join all parts with '#' ensuring no unwanted spaces or line breaks
  }
}

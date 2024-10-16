import { Injectable } from "@nestjs/common";
import { Company } from "../entities/company.entity";
import { CreditRetirementSl } from "../entities/creditRetirementSl.entity";
import { User } from "../entities/user.entity";

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
      fromCompany?.companyId || 'N/A',  
      fromCompany?.name || 'N/A',       
      toCompany?.companyId || fromCompany.companyId,    
      toCompany?.name || fromCompany?.name,        
      retireRequest.requestId,
      retireRequest.creditType,
      retireRequest.comment,
      retireRequest.creditAmount
    ];
    return parts.filter(part => part).join('#');  // Join all parts with '#' ensuring no unwanted spaces or line breaks
  }
}

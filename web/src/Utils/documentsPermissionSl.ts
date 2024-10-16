import { CompanyRole } from '../Definitions/Enums/company.role.enum';
import { DocumentStatus } from '../Definitions/Enums/document.status';
import { DocType } from '../Definitions/Enums/document.type';
import { Role } from '../Definitions/Enums/role.enum';

export const linkDocVisible = (docStatus: DocumentStatus) => {
  let visible = false;
  if (
    docStatus === DocumentStatus.PENDING ||
    docStatus === DocumentStatus.ACCEPTED ||
    docStatus === DocumentStatus.REJECTED
  ) {
    visible = true;
  }
  return visible;
};

export const formCreatePermission = (userInfoState: any, docType: DocType) => {
  if (
    docType === DocType.COST_QUOTATION &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  }

  if (
    docType === DocType.VALIDATION_AGREEMENT &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  }

  if (
    docType === DocType.PROPOSAL &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  }

  if (
    docType === DocType.CMA &&
    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  }

  return false;
};

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
  } else if (
    docType === DocType.VALIDATION_AGREEMENT &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.PROPOSAL &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.CMA &&
    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_REPORT &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.PROJECT_REGISTRATION_CERTIFICATE &&
    userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.MONITORING_REPORT &&
    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.VERIFICATION_REPORT &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_REPORT &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  }

  return false;
};
export const formViewPermission = (userInfoState: any, docType: DocType) => {
  if (
    docType === DocType.COST_QUOTATION &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE)
  ) {
    return true;
  } else if (
    docType === DocType.PROPOSAL &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE)
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_AGREEMENT &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE)
  ) {
    return true;
  } else if (
    docType === DocType.CMA &&
    (userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE)
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_REPORT &&
    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
  ) {
    return true;
  } else if (
    docType === DocType.PROJECT_REGISTRATION_CERTIFICATE &&
    (userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER)
  ) {
    return true;
  } else if (
    docType === DocType.MONITORING_REPORT &&
    (userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND)
  ) {
    return true;
  } else if (
    docType === DocType.VERIFICATION_REPORT &&
    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_REPORT &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE)
  ) {
    return true;
  }

  return false;
};

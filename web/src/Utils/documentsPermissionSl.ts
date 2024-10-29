import { CompanyRole } from '../Definitions/Enums/company.role.enum';
import { DocumentStatus } from '../Definitions/Enums/document.status';
import { DocType } from '../Definitions/Enums/document.type';
import { ProjectProposalStage } from '../Definitions/Enums/programmeStage.enum';
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

export const formCreatePermission = (
  userInfoState: any,
  docType: DocType,
  projectProposalStage: ProjectProposalStage
) => {
  if (
    docType === DocType.COST_QUOTATION &&
    projectProposalStage === ProjectProposalStage.APPROVED_INF &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_AGREEMENT &&
    projectProposalStage === ProjectProposalStage.SUBMITTED_PROPOSAL &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.PROPOSAL &&
    projectProposalStage === ProjectProposalStage.SUBMITTED_COST_QUOTATION &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.CMA &&
    (projectProposalStage === ProjectProposalStage.ACCEPTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.REJECTED_CMA) &&
    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_REPORT &&
    (projectProposalStage === ProjectProposalStage.APPROVED_CMA ||
      projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION) &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.PROJECT_REGISTRATION_CERTIFICATE &&
    projectProposalStage === ProjectProposalStage.AUTHORISED &&
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
  }

  return false;
};

export const formViewPermission = (
  userInfoState: any,
  docType: DocType,
  projectProposalStage: ProjectProposalStage
) => {
  if (
    docType === DocType.COST_QUOTATION &&
    (projectProposalStage === ProjectProposalStage.SUBMITTED_COST_QUOTATION ||
      projectProposalStage === ProjectProposalStage.SUBMITTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT ||
      projectProposalStage === ProjectProposalStage.ACCEPTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.REJECTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.SUBMITTED_CMA ||
      projectProposalStage === ProjectProposalStage.REJECTED_CMA ||
      projectProposalStage === ProjectProposalStage.APPROVED_CMA ||
      projectProposalStage === ProjectProposalStage.VALIDATION_PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION ||
      projectProposalStage === ProjectProposalStage.AUTHORISED) &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND)
  ) {
    return true;
  } else if (
    docType === DocType.PROPOSAL &&
    (projectProposalStage === ProjectProposalStage.SUBMITTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT ||
      projectProposalStage === ProjectProposalStage.ACCEPTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.REJECTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.SUBMITTED_CMA ||
      projectProposalStage === ProjectProposalStage.REJECTED_CMA ||
      projectProposalStage === ProjectProposalStage.APPROVED_CMA ||
      projectProposalStage === ProjectProposalStage.VALIDATION_PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION ||
      projectProposalStage === ProjectProposalStage.AUTHORISED) &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND)
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_AGREEMENT &&
    (projectProposalStage === ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT ||
      projectProposalStage === ProjectProposalStage.ACCEPTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.REJECTED_PROPOSAL ||
      projectProposalStage === ProjectProposalStage.SUBMITTED_CMA ||
      projectProposalStage === ProjectProposalStage.REJECTED_CMA ||
      projectProposalStage === ProjectProposalStage.APPROVED_CMA ||
      projectProposalStage === ProjectProposalStage.VALIDATION_PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION ||
      projectProposalStage === ProjectProposalStage.AUTHORISED) &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND)
  ) {
    return true;
  } else if (
    docType === DocType.CMA &&
    (projectProposalStage === ProjectProposalStage.SUBMITTED_CMA ||
      projectProposalStage === ProjectProposalStage.REJECTED_CMA ||
      projectProposalStage === ProjectProposalStage.APPROVED_CMA ||
      projectProposalStage === ProjectProposalStage.VALIDATION_PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION ||
      projectProposalStage === ProjectProposalStage.AUTHORISED) &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND)
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_REPORT &&
    (projectProposalStage === ProjectProposalStage.VALIDATION_PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION ||
      projectProposalStage === ProjectProposalStage.AUTHORISED) &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND)
  ) {
    return true;
  } else if (
    docType === DocType.PROJECT_REGISTRATION_CERTIFICATE &&
    projectProposalStage === ProjectProposalStage.AUTHORISED &&
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
  }

  return false;
};

export const formEditPermission = (
  userInfoState: any,
  docType: DocType,
  projectProposalStage: ProjectProposalStage
) => {
  if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION &&
    userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  }
  // else if (
  //   docType === DocType.VALIDATION_AGREEMENT &&
  //   projectProposalStage === ProjectProposalStage.SUBMITTED_PROPOSAL &&
  //   userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
  //   userInfoState?.userRole !== Role.ViewOnly
  // ) {
  //   return true;
  // } else if (
  //   docType === DocType.PROPOSAL &&
  //   projectProposalStage === ProjectProposalStage.SUBMITTED_COST_QUOTATION &&
  //   userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
  //   userInfoState?.userRole !== Role.ViewOnly
  // ) {
  //   return true;
  // } else if (
  //   docType === DocType.CMA &&
  //   (projectProposalStage === ProjectProposalStage.ACCEPTED_PROPOSAL ||
  //     projectProposalStage === ProjectProposalStage.REJECTED_CMA) &&
  //   userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
  //   userInfoState?.userRole !== Role.ViewOnly
  // ) {
  //   return true;
  // } else if (
  //   docType === DocType.VALIDATION_REPORT &&
  //   (projectProposalStage === ProjectProposalStage.APPROVED_CMA ||
  //     projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION) &&
  //   userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
  //   userInfoState?.userRole !== Role.ViewOnly
  // ) {
  //   return true;
  // } else if (
  //   docType === DocType.PROJECT_REGISTRATION_CERTIFICATE &&
  //   projectProposalStage === ProjectProposalStage.AUTHORISED &&
  //   userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE &&
  //   userInfoState?.userRole !== Role.ViewOnly
  // ) {
  //   return true;
  // } else if (
  //   docType === DocType.MONITORING_REPORT &&
  //   userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
  //   userInfoState?.userRole !== Role.ViewOnly
  // ) {
  //   return true;
  // } else if (
  //   docType === DocType.VERIFICATION_REPORT &&
  //   userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
  //   userInfoState?.userRole !== Role.ViewOnly
  // ) {
  //   return true;
  // }

  return false;
};

export const isShowCreateButton = (
  userInfoState: any,
  docType: DocType,
  projectProposalStage: ProjectProposalStage
) => {
  if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage !== ProjectProposalStage.REJECTED_VALIDATION &&
    projectProposalStage !== ProjectProposalStage.VALIDATION_PENDING &&
    projectProposalStage !== ProjectProposalStage.AUTHORISED
  ) {
    return true;
  }

  return false;
};

export const isShowEditButton = (
  userInfoState: any,
  docType: DocType,
  projectProposalStage: ProjectProposalStage
) => {
  if (
    docType === DocType.VALIDATION_REPORT &&
    (projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION ||
      projectProposalStage === ProjectProposalStage.VALIDATION_PENDING ||
      projectProposalStage === ProjectProposalStage.AUTHORISED)
  ) {
    return true;
  }

  return false;
};

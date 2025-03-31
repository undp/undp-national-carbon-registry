import { Iactivity } from '../Components/ProjectDetailsView/projectForms/VerificationPhaseForms';
import { CompanyRole } from '../Definitions/Enums/company.role.enum';
import { DocumentEnum } from '../Definitions/Enums/document.enum';
import { DocumentStatus } from '../Definitions/Enums/document.status';
import { DocType } from '../Definitions/Enums/document.type';
import { FormMode } from '../Definitions/Enums/formMode.enum';
import { ActivityStateEnum, ProjectProposalStage } from '../Definitions/Enums/programmeStage.enum';
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

export const formPermissions = (
  userInfoState: any,
  docType: DocType,
  projectProposalStage: ProjectProposalStage,
  documents: any
) => {
  console.log(
    '--------Permissions form func----------',
    userInfoState,
    docType,
    projectProposalStage,
    documents
  );

  //PDD: Permissions pending and rejected stage for all users
  if (
    docType === DocType.PDD &&
    (projectProposalStage === ProjectProposalStage.PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED)
  ) {
    return { mode: FormMode.DISABLED, userCompanyRole: userInfoState?.companyRole };
  }
  //PDD: Permissions for PD Admin users at APPROVED stage
  else if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.APPROVED &&
    userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER &&
    userInfoState?.userRole === Role.Admin
  ) {
    return {
      mode: FormMode.CREATE,
      userCompanyRole: userInfoState?.companyRole,
      documents: documents,
    };
  }

  //PDD: Permissions for PD Admin users at PDD_REJECTED_BY_CERTIFIER, PDD_REJECTED_BY_DNA
  else if (
    docType === DocType.PDD &&
    (projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER ||
      projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_DNA) &&
    userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER &&
    userInfoState?.userRole === Role.Admin
  ) {
    return {
      mode: FormMode.EDIT,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  //PDD: Permissions for PD Other users at PDD_REJECTED_BY_CERTIFIER, PDD_REJECTED_BY_DNA
  else if (
    docType === DocType.PDD &&
    (projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER ||
      projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_DNA) &&
    userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  //PDD: Permissions Other users at PDD_REJECTED_BY_CERTIFIER, PDD_REJECTED_BY_DNA
  else if (
    docType === DocType.PDD &&
    (projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER ||
      projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_DNA) &&
    userInfoState?.companyRole !== CompanyRole.PROJECT_DEVELOPER
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  //PDD: Permissions for other users for PDD at APPROVED stage
  else if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.APPROVED &&
    userInfoState?.companyRole !== CompanyRole.PROJECT_DEVELOPER
  ) {
    return { mode: FormMode.DISABLED, userCompanyRole: userInfoState?.companyRole };
  }
  //PDD: Permissions for IC Admin user at PDD_SUBMITTED stage
  else if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.PDD_SUBMITTED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole === Role.Admin
  ) {
    return {
      mode: FormMode.VERIFY,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  //PDD: Permissions for IC other users at PDD_SUBMITTED stage
  else if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.PDD_SUBMITTED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  //PDD:  Permissions for other users at PDD_SUMITTESD stage
  else if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.PDD_SUBMITTED &&
    userInfoState?.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  //PDD:  Permissions for DNA root and DNA Admin users at PDD_APPROVED_BY_CERTIFIER stage
  else if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER &&
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole !== Role.ViewOnly || userInfoState?.userRole !== Role.Manager)
  ) {
    return {
      mode: FormMode.VERIFY,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  // PDD: Permissions for other DNA users at PDD_APPROVED_BY_CERTIFIER stage
  else if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER &&
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole === Role.ViewOnly || userInfoState?.userRole === Role.Manager)
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  // PDD: Permissions for other users at PDD_APPROVED_BY_CERTIFIER
  else if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER &&
    userInfoState?.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }
  // PDD: Permissions for all users at and after PDD_APPROVED_BY_DNA
  else if (
    docType === DocType.PDD &&
    (projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_DNA ||
      projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_SUBMITTED ||
      projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_REJECTED ||
      projectProposalStage === ProjectProposalStage.AUTHORISED)
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.PDD?.refId,
    };
  }

  // VALIDATION_REPORT: for all users at stages before PDD_APPROVED_BY_DNA
  else if (
    docType === DocType.VALIDATION_REPORT &&
    (projectProposalStage === ProjectProposalStage.PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED ||
      projectProposalStage === ProjectProposalStage.APPROVED ||
      projectProposalStage === ProjectProposalStage.PDD_SUBMITTED ||
      projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER ||
      projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER ||
      projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_DNA)
  ) {
    return { mode: FormMode.DISABLED, userCompanyRole: userInfoState?.companyRole };
  }
  // VALIDATION_REPORT: for IC admin user at PDD_APPROVED_BY_DNA
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_DNA &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole === Role.Admin
  ) {
    return {
      mode: FormMode.CREATE,
      userCompanyRole: userInfoState?.companyRole,
      documents: documents,
    };
  }
  // VALIDATION_REPORT: for IC admin user at VALIDATION_REPORT_REJECTED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_REJECTED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole === Role.Admin
  ) {
    return {
      mode: FormMode.EDIT,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  }
  // VALIDATION_REPORT: for IC other users at VALIDATION_REPORT_REJECTED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_REJECTED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  }
  // VALIDATION_REPORT: for other IC users at PDD_APPROVED_BY_DNA
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_DNA &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return { mode: FormMode.DISABLED, userCompanyRole: userInfoState?.companyRole };
  }
  // VALIDATION_REPORT: for other users at PDD_APPROVED_BY_DNA
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_DNA &&
    userInfoState?.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER
  ) {
    return { mode: FormMode.DISABLED, userCompanyRole: userInfoState?.companyRole };
  }
  // VALIDATION_REPORT: for PD users & IC users at VALIDATION_REPORT_SUBMITTED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_SUBMITTED &&
    userInfoState?.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  }
  // VALIDATION_REPORT: for DNA Root and Admin at VALIDATION_REPORT_SUBMITTED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_SUBMITTED &&
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole === Role.Admin || userInfoState?.userRole === Role.Root)
  ) {
    return {
      mode: FormMode.VERIFY,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  }
  // VALIDATION_REPORT: for DNA other users at VALIDATION_REPORT_SUBMITTED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_SUBMITTED &&
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    userInfoState?.userRole !== Role.Admin &&
    userInfoState?.userRole !== Role.Root
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  }

  // VALIDATION_REPORT: for other users at VALIDATION_REPORT_SUBMITTED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_SUBMITTED &&
    userInfoState?.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  }

  // VALIDATION_REPORT: for IC other users at VALIDATION_REPORT_REJECTED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_REJECTED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  }

  // VALIDATION_REPORT: for other users at VALIDATION_REPORT_REJECTED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_REJECTED &&
    userInfoState?.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  }

  // VALIDATION_REPORT: for all users at AUTHORIZED
  else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.AUTHORISED
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents?.VALIDATION?.refId,
    };
  } else {
    return { mode: FormMode.DISABLED };
  }
};

export const activityPermissions = (
  userInfoState: any,
  docType: DocType,
  activity: Iactivity,
  documents?: any
) => {
  // MONITORING_REPORT: for IC Admin users at MONITORING_REPORT_UPLOADED
  if (
    docType === DocType.MONITORING_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_UPLOADED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole === Role.Admin &&
    documents
  ) {
    return {
      mode: FormMode.VERIFY,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.MONITORING?.refId,
    };
  }

  // MONITORING_REPORT: for IC other users at MONITORING_REPORT_UPLOADED
  else if (
    docType === DocType.MONITORING_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_UPLOADED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.MONITORING?.refId,
    };
  }

  // MONITORING_REPORT: for other users at MONITORING_REPORT_UPLOADED
  else if (
    docType === DocType.MONITORING_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_UPLOADED &&
    userInfoState?.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.MONITORING?.refId,
    };
  }

  // MONITORING_REPORT: for PD Admin users at MONITORING_REPORT_REJECTED
  else if (
    docType === DocType.MONITORING_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_REJECTED &&
    userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER &&
    userInfoState?.userRole === Role.Admin
  ) {
    return {
      mode: FormMode.EDIT,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.MONITORING?.refId,
      documents: documents,
    };
  }

  // MONITORING_REPORT: for PD Other users at MONITORING_REPORT_REJECTED
  else if (
    docType === DocType.MONITORING_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_REJECTED &&
    userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.MONITORING?.refId,
    };
  }

  // MONITORING_REPORT: for Other users at MONITORING_REPORT_REJECTED
  else if (
    docType === DocType.MONITORING_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_REJECTED &&
    userInfoState?.companyRole !== CompanyRole.PROJECT_DEVELOPER
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.MONITORING?.refId,
    };
  }

  // MONITORING_REPORT: for all users at MONITORING_REPORT_VERIFIED
  else if (
    docType === DocType.MONITORING_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_VERIFIED
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.MONITORING?.refId,
    };
  }

  // MONITORING_REPORT: for all users at VERIFICATion_REPORT_UPLOADED, VERIFICATION_REPORT_REJECTED, VERIFICATION_REPORT_VERIFIED
  else if (
    docType === DocType.MONITORING_REPORT &&
    (activity.stage === ActivityStateEnum.VERIFICATION_REPORT_UPLOADED ||
      activity.stage === ActivityStateEnum.VERIFICATION_REPORT_REJECTED ||
      activity.stage === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED)
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.MONITORING?.refId,
    };
  }

  // VERIFICATION_REPORT: for all users at MONITORING_REPORT_UPLOADED, MONITORING_REPORT_REJECTED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    (activity.stage === ActivityStateEnum.MONITORING_REPORT_UPLOADED ||
      activity.stage === ActivityStateEnum.MONITORING_REPORT_REJECTED)
  ) {
    return {
      mode: FormMode.DISABLED,
      userCompanyRole: userInfoState?.companyRole,
    };
  }

  // VERIFICATION_REPORT: for IC Admin User at MONITORING_REPORT_VERIFIED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_VERIFIED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole === Role.Admin
  ) {
    return {
      mode: FormMode.CREATE,
      userCompanyRole: userInfoState?.companyRole,
      activityId: activity.refId,
      documents: documents,
    };
  }

  // VERIFICATION_REPORT: for IC Users at MONITORING_REPORT_VERIFIED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_VERIFIED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return {
      mode: FormMode.DISABLED,
    };
  }

  // VERIFICATION_REPORT: for Other Users at MONITORING_REPORT_VERIFIED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.MONITORING_REPORT_VERIFIED &&
    userInfoState?.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER
  ) {
    return {
      mode: FormMode.DISABLED,
    };
  }

  // VERIFICATION_REPORT: for DNA Admin and Root Users at VERIFICATION_REPORT_UPLOADED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.VERIFICATION_REPORT_UPLOADED &&
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole === Role.Admin || userInfoState?.userRole === Role.Root)
  ) {
    return {
      mode: FormMode.VERIFY,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.VERIFICATION?.refId,
    };
  }

  // VERIFICATION_REPORT: for DNA Other Users at VERIFICATION_REPORT_UPLOADED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.VERIFICATION_REPORT_UPLOADED &&
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole !== Role.Admin || userInfoState?.userRole !== Role.Root)
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.VERIFICATION?.refId,
    };
  }

  // VERIFICATION_REPORT: for Other Users at VERIFICATION_REPORT_UPLOADED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.VERIFICATION_REPORT_UPLOADED &&
    userInfoState?.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.VERIFICATION?.refId,
    };
  }

  // VERIFICATION_REPORT: for IC Admin Users at VERIFICATION_REPORT_REJECTED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.VERIFICATION_REPORT_REJECTED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole === Role.Admin
  ) {
    return {
      mode: FormMode.EDIT,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.VERIFICATION?.refId,
      activityId: activity.refId,
      documents: documents,
    };
  }

  // VERIFICATION_REPORT: for IC Other Users at VERIFICATION_REPORT_REJECTED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.VERIFICATION_REPORT_REJECTED &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
    userInfoState?.userRole !== Role.Admin
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.VERIFICATION?.refId,
    };
  }

  // VERIFICATION_REPORT: for Other Users at VERIFICATION_REPORT_REJECTED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.VERIFICATION_REPORT_REJECTED &&
    userInfoState?.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER
  ) {
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.VERIFICATION?.refId,
    };
  }

  // VERIFICATION_REPORT: for All Users at VERIFICATION_REPORT_APPROVED
  else if (
    docType === DocType.VERIFICATION_REPORT &&
    activity.stage === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED
  ) {
    console.log('----------------verification-----------', documents.VERIFICATION?.refId, activity);
    return {
      mode: FormMode.VIEW,
      userCompanyRole: userInfoState?.companyRole,
      documentRefId: documents.VERIFICATION?.refId,
    };
  } else {
    return {
      mode: FormMode.DISABLED,
    };
  }
};

export const formCreatePermission = (
  userInfoState: any,
  docType: DocType,
  projectProposalStage: ProjectProposalStage
) => {
  if (
    docType === DocType.PDD &&
    projectProposalStage === ProjectProposalStage.APPROVED &&
    userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_REPORT &&
    projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_DNA &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER &&
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
    docType === DocType.PDD &&
    (projectProposalStage === ProjectProposalStage.PDD_SUBMITTED ||
      projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER ||
      projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_DNA ||
      projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER ||
      projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_DNA ||
      projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_SUBMITTED ||
      projectProposalStage === ProjectProposalStage.VALIDATION_REPORT_REJECTED ||
      projectProposalStage === ProjectProposalStage.AUTHORISED) &&
    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
  ) {
    return true;
  } else if (
    docType === DocType.PDD &&
    (projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER ||
      projectProposalStage === ProjectProposalStage.PDD_APPROVED_BY_DNA ||
      projectProposalStage === ProjectProposalStage.PDD_REJECTED_BY_DNA) &&
    userInfoState?.companyRole === CompanyRole.INDEPENDENT_CERTIFIER
  ) {
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
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
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
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
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
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
  ) {
    return true;
  } else if (
    docType === DocType.SITE_VISIT_CHECKLIST &&
    (projectProposalStage === ProjectProposalStage.APPROVED_CMA ||
      projectProposalStage === ProjectProposalStage.VALIDATION_PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION ||
      projectProposalStage === ProjectProposalStage.AUTHORISED) &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
  ) {
    return true;
  } else if (
    docType === DocType.VALIDATION_REPORT &&
    (projectProposalStage === ProjectProposalStage.VALIDATION_PENDING ||
      projectProposalStage === ProjectProposalStage.REJECTED_VALIDATION ||
      projectProposalStage === ProjectProposalStage.AUTHORISED) &&
    (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
  ) {
    return true;
  } else if (
    docType === DocType.PROJECT_REGISTRATION_CERTIFICATE &&
    projectProposalStage === ProjectProposalStage.AUTHORISED &&
    (userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
  ) {
    return true;
  } else if (
    docType === DocType.MONITORING_REPORT &&
    (userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
  ) {
    return true;
  } else if (
    docType === DocType.VERIFICATION_REPORT &&
    (userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
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
  } else if (
    docType === DocType.CMA &&
    projectProposalStage === ProjectProposalStage.REJECTED_CMA &&
    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
    userInfoState?.userRole !== Role.ViewOnly
  ) {
    return true;
  }

  return false;
};

export const formDownloadPermission = (
  userInfoState: any,
  docType: DocType,
  projectProposalStage: ProjectProposalStage
) => {
  if (
    docType === DocType.PROJECT_REGISTRATION_CERTIFICATE &&
    projectProposalStage === ProjectProposalStage.AUTHORISED &&
    (userInfoState?.companyRole === CompanyRole.CLIMATE_FUND ||
      userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ||
      userInfoState?.companyRole === CompanyRole.EXECUTIVE_COMMITTEE ||
      userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      userInfoState?.companyRole === CompanyRole.CERTIFIER ||
      userInfoState?.companyRole === CompanyRole.MINISTRY)
  ) {
    return true;
  }

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
  } else if (
    docType === DocType.CMA &&
    projectProposalStage === ProjectProposalStage.ACCEPTED_PROPOSAL
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
  } else if (
    docType === DocType.CMA &&
    projectProposalStage === ProjectProposalStage.REJECTED_CMA
  ) {
    return true;
  }

  return false;
};

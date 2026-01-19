export const ROUTES = {
  //PROGRAMME
  VIEW_PROGRAMMES: '/programmeManagement/viewAll',
  VIEW_PROGRAMME: '/programmeManagement/view/',
  PROGRAMME_DETAILS_BY_ID: (id: string) => `/programmeManagement/view/${id}`,
  PROGRAMME_DETAILS_BY_REF_ID: (refId: string) => `/programmeManagement/view/${refId}`,
  //PROGRAMME_DETAILS_BY_PROGRAMME_ID: (programId: string) => `/programmeManagement/view/${programId}`,
  ADD_PROGRAMME: '/programmeManagement/addProgramme',
  ADD_INVESTMENT_TO_PROGRAMME: '/programmeManagement/addInvestment',
  // PROGRAMME VIEW -> INF VIEW
  INF_VIEW: (id: string) => `/programmeManagement/addProgramme/${id}`,
  //USERS
  VIEW_USERS: '/userManagement/viewAll',
  VIEW_USER_PROFILE: '/userProfile/view',
  UPDATE_USER: '/userManagement/updateUser',
  ADD_NEW_USER: '/userManagement/addUSer',
  //AUTH
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgotPassword',
  //COST_QUOTATION
  COST_QUOTATION_VIEW: (programmeId: any) => `/programmeManagement/addCostQuotation/${programmeId}`,
  //PROJECT-PROPOSAL
  PROJECT_PROPOSAL_VIEW: (programmeId: any) =>
    `/programmeManagement/projectProposal/${programmeId}`,
  //CMA
  CMA_FORM: (programmeId: any) => `/programmeManagement/pdd/${programmeId}`,
  // PDD
  PDD_FORM: (refId: any) => `/programmeManagement/pdd/${refId}`,
  //VALIDATION
  VALIDATION_AGREEMENT: (programmeId: any) =>
    `/programmeManagement/validationAgreement/${programmeId}`,
  VALIDATION_REPORT: (programmeId: any) => `/programmeManagement/validationReport/${programmeId}`,
  //MONITORING-REPORT
  MONITORING_REPORT_CREATE: (id: string) => `/programmeManagement/monitoringReport/${id}`,
  MONITORING_REPORT_CREATE_BY_PROGRAMME_ID: (programmeId: any) =>
    `/programmeManagement/monitoringReport/${programmeId}`,
  MONITORING_REPORT_ACTION: (programmeId: any, verificationRequestId: any) =>
    `/programmeManagement/monitoringReport/${programmeId}/${verificationRequestId}`,
  //VERIFICATION-REPORT
  VERIFICATION_REPORT: (programmeId: any) =>
    `/programmeManagement/verificationReport/${programmeId}`,
  VERIFICATION_REPORT_ACTION: (programmeId: any, verificationRequestId: any) =>
    `/programmeManagement/verificationReport/${programmeId}/${verificationRequestId}`,
  //DASHBOARD
  DASHBOARD: '/dashboard',
  REGISTRY_DASHBOARD: '/dashboard/cr',
  //ORGANIZATION
  VIEW_ORGANIZATIONS: '/companyManagement/viewAll',
  VIEW_ORGANIZATION_PROFILE: '/companyProfile/view',
  ADD_ORGANIZATION: '/companyManagement/addCompany',
  UPDATE_ORGANIZATION: '/companyManagement/updateCompany',
  REGISTER_ORGANIZATION: '/companyManagement/registerCompany',
  REGISTER_ORGANIZATION_FROM_LOGIN: '/registerCompany',
  //INVESTMENT
  VIEW_INVESTMENTS: '/investmentManagement/viewAll',
  ADD_INVESTMENT: '/investmentManagement/addInvestment',
  //NDC
  VIEW_NDC: '/ndcManagement/view',
  VIEW_ALL_NDC: '/ndcManagement/viewAll',
  ADD_NDC_ACTION: '/programmeManagement/addNdcAction',
  //SITE-VISIT
  SITE_VISIT_CHECKLIST: (id: string) => `/programmeManagement/siteVisitCheckList/${id}`,
  SITE_VISIT_REPORT_BY_PROGRAMME_ID: (programmeId: any) =>
    `/programmeManagement/siteVisitCheckList/${programmeId}`,
};

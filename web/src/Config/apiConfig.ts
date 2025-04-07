export const API_PATHS = {
  //AUTH
  LOGIN: "national/auth/login",
  FORGOT_PW: "national/auth/forgotPassword",
  RESET_PW: (requestId: string) =>
    `national/auth/resetPassword?requestId=${requestId}`,
  REFRESH_ACCESS_TOKEN: "national/auth/login/refresh",
  //USER
  USER_PROFILE: "national/user/profile",
  USER_DETAILS: "national/user/query",
  ADD_USER: "national/user/add",
  REGISTER_USER: "national/user/register",
  UPDATE_USER: "national/user/update",
  DELETE_USER: (userId: string) => `national/user/delete?userId=${userId}`,
  RESET_PASSWORD_USER: "national/user/resetPassword",
  USER_PROFILE_DETAILS: "national/user/profile",
  DOWNLOAD_USER_DATA: "national/user/download",
  //PROJECT
  PROJECT_CREATE: "project/create",
  GET_PROJECT: "project/query",
  PROJECT_BY_ID: "programmeSl/getProjectById",
  ALL_PROJECTS: "programme/query",
  ADD_PROJECT_DOC: "programme/addDocument",
  PROJECT_DOC_ACTION: "programme/docAction",
  PROJECT_DOCS: "programme/queryDocs",
  NEW_PROJECT: "programme/create",
  PROJECT_DOWNLOAD: "programme/download",
  PROGRAMME_BY_ID: "project/getProjectById", //Change this to project later
  PROJECT_HISTORY_BY_ID: (programmeId: string) =>
    `programme/getHistory?programmeId=${programmeId}`,
  PROJECT_BY_STATUS: "stats/programme/queryProgrammesByStatus",
  PROJECT_BY_CATEGORY: "stats/programme/queryProgrammesByCategory",
  PROJECT_ACTION: (action: string) => `programme/${action}`,
  // CREDITS
  CREDIT_BALANCE_QUERY: "creditTokens/queryBalance",
  CREDIT_TRANSFERS_QUERY: "creditTokens/queryTransfers",
  CREDIT_RETIREMENT_QUERY: "creditTokens/queryRetirements",
  TRANSFER_ORGANIZATIONS: "organisation/getOrganizations",
  CB_RETIRE_COINTRY_QUERY: "location/countries",
  CREDIT_RETIREMENT_REQUEST: "creditTokens/retireRequest",
  CREDIT_RETIREMENT_PERFROM: "creditTokens/performRetireAction",
  CREDIT_TRANSFER_REQUEST: "creditTokens/transfer",
  //LOCATION
  PROVINCES: "national/location/province",
  DISTRICTS: "national/location/district",
  CITIES: "national/location/city",
  POSTALCODE: "national/location/postalCode",
  DIVISIONS: "location/division",
  COUNTRIES: "location/countries",
  //DOC-VERSIONS
  LAST_DOC_VERSION: "programmeSl/getDocLastVersion",
  LAST_DOC_VERSIONS: "programmeSl/getDocVersions",
  DOC_BY_VERSION: "programmeSl/getDocByVersion",
  CREATE_COST_COTATION: "programmeSl/createCostQuotation",
  //ORGANIZATION
  COUNTRY_LIST: "national/organisation/countries",
  REGIONS: "national/organisation/regions",
  ORGANIZATION_BY_TYPE: "national/organisation/byType",
  ORGANIZATION_DETAILS: "national/organisation/query",
  UPDATE_ORGANIZATION: "national/organisation/update",
  ORGANIZATION_NAMES: "national/organisation/queryNames",
  DOWNLOAD_ORGANIZATION_DATA: "national/organisation/download",
  ORGANIZATION_PROFILE_DETAILS: (companyId: string) =>
    `national/organisation/profile?id=${companyId}`,
  ORG_SUSPEND: (companyId: string) =>
    `national/organisation/suspend?id=${companyId}`,
  ORG_REACTIVATE: (companyId: string) =>
    `national/organisation/activate?id=${companyId}`,
  ORG_APPROVE: (companyId: string) =>
    `national/organisation/approve?id=${companyId}`,
  ORG_REJECT: (companyId: string) =>
    `national/organisation/reject?id=${companyId}`,
  //CARBON_NEUTRAL
  ISSURE_CARBON_NEUTRAL_CERTIFICATE:
    "programmeSl/issueCarbonNeutralCertificate",
  CARBON_NEUTRAL_CERTIFICATES: "programmeSl/getCarbonNeutralCertificates",
  REQUEST_CARBON_NEUTRAL_CERTIFICATE:
    "programmeSl/requestCarbonNeutralCertificate",
  //INVESTMENT
  INVESTMENT_LIST: "programme/investmentQuery",
  ADD_PROJECT_INVESTMENT: "programme/addInvestment",
  ADD_ORGANIZATION_INVESTMENT: "organisation/addInvestment",
  DOWNLOAD_PROJECT_INVESTMENT_DATA: "programme/investments/download",
  //VERIFICATION
  VERIFICATION_DOC_VERSIONS: "programmeSl/getVerificationDocVersions",
  VERIFICATION_DOC_BY_VERSION: "programmeSl/getVerificationDocByVersion",
  VERIFICATION_DOC_LAST_VERSION: "programmeSl/getVerificationDocLastVersion",
  VERIFY_VERIFICATION_REPORT: "verification/verifyVerificationReport",
  CREATE_VERIFICATION_REPORT: "verification/createVerificationReport",
  VERIFICATION_HISTORY_BY_ID: (programmeId: string) =>
    `verification?programmeId=${programmeId}`,
  //MONITORING
  VERIFY_MONITORING_REPORT: "verification/verifyMonitoringReport",
  CREATE_MONITORING_REPORT: "verification/createMonitoringReport",
  //NDC
  NDC_ACTION: "programme/addNDCAction",
  NDC_ACTION_HISTORY: "programme/queryNdcActions",
  NDC_ACTIONS_DOWNLOAD: "programme/queryNdcActions/download",
  //NOTIFICATION
  REJECT_NOTIFICATION_FORM: "project/inf/reject",
  APPROVE_NOTIFICATION_FORM: "project/inf/approve",
  //PROPOSAL
  REJECT_PROPOSAL: "project/proposal/reject",
  APPROVE_PROPOSAL: "programmeSl/proposal/approve",
  CREATE_PROJECT_PROPOSAL: "programmeSl/createProjectProposal",
  //CMA
  REJECT_CMA: "programmeSl/cma/reject",
  APPROVE_CMA: "programmeSl/cma/approve",
  CMA_CREATION: "programmeSl/createCMA",
  //DOCUMENT
  ADD_DOCUMENT: "document/add",
  QUERY_DOCUMENT: "document/query",
  APPROVE_DOCUMENT: (id: string) => `document/approve?id=${id}`,
  REJECT_DOCUMENT: (id: string) => `document/reject?id=${id}`,
  VERIFY_DOCUMENT: `document/verify`,
  //TRANSFER
  TRANSFER_ACTION: "programme/",
  TRANSFER_ON_FREEZE: "Settings/update",
  PROJECT_TRANSFERS: "programme/transferQuery",
  TRANSFER_DOWNLOAD: "programme/transfers/download",
  CREDIT_RETIRE_TRANSFER_ACTION: "retire/create",
  PROGRAM_TRANSFERS: "retire/query",
  CANCEL_TRANSFER_REQUEST: "retire/status",
  TRANSFER_BY_PROJECT_ID: (programmeId: string) =>
    `programme/transfersByProgrammeId?programmeId=${programmeId}`,
  PROJECT_HISTORY_LOGS: (id: string) => `project/logs?refId=${id}`,
  // TRANSFER_FORZEN_STATUS: (isTransferFrozen:string) => `Settings/query?id=${isTransferFrozen}`
  TRANSACTION_RECORDS_WITHOUT_TIME_RANGE: "stats/national-accounting/query",
  //DASHBOARD
  GET_ALL_DATA_COUNTS: "analytics/all",
  GET_PENDING_ACTIONS: "analytics/getPendingActions",
  GET_PROJECTS_DATA: "analytics/getProjectsData",
  GET_PROJECT_SUMMARY: "analytics/getProjectSummary",
  GET_PROJECT_STATUS_SUMMARY: "analytics/getProjectStatusSummary",
  GET_PROJECTS_BY_STATUS_DETAIL: "analytics/getProjectsByStatusDetail",
  GET_PROJECT_COUNT_BY_SECTOR: "analytics/getProjectCountBySector",
  GET_CREDIT_SUMMARY: "analytics/getCreditSummary",
  GET_CREDIT_SUMMARY_BY_DATE: "analytics/creditsSummaryByDate",
  //UNUSED APIS
  ALL_PROGRAMS_AGG_CHART_STATS: "stats/programme/agg",
  TOTAL_PROGRAM_COUNT: "stats/programme/totalSLProjects",
  TOTAL_ISSUED_CREDITS: "stats/programme/totalIssuedCredits",
  TOTAL_CREDITS: "stats/national-accounting/total",
  CREDITS_BY_STATUS: "stats/programme/queryCreditsByStatus",
  CREDITS_BY_DATE: "stats/programme/queryCreditsByDate",
  CREDITS_BY_PURPOSE: "stats/programme/queryCreditsByPurpose",
  COUNTRY_CREDIT_RECORDS: "stats/national-accounting/query-by-country",
  TOTAL_RETIERED_CREDITS: "stats/programme/totalRetiredCredits",
  RETIREMENTS_BY_DATE: "stats/programme/queryRetirementsByDate",
  //SIGN
  SIGNS_UPDATE: "Settings/signs/update",
  CEO_SIGN: (ceoSign: string) => `Settings/query?id=${ceoSign}`,
  CHAIRMAN_SIGN: (chairmanSign: string) => `Settings/query?id=${chairmanSign}`,
  PREVIEW_CERTIFICATE: (type: string) => `Settings/certificates?type=${type}`,
  //VALIDATION
  CREATE_VALIDATION_AGGREMENT: "programmeSl/createValidationAgreement",
  CREATE_VALIIDATION_REPORT: "programmeSL/validation/create",
  REJECT_VALIDATION: "programmeSl/validation/reject",
  APPROVE_VALIDATION: "programmeSl/validation/approve",
  POPUP_ACTION: (endpoint: string) => `programme/${endpoint}`,
};

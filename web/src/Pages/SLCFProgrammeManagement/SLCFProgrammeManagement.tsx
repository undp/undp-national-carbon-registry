// import { useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { useAbilityContext } from '../../Casl/Can';
// import { ProgrammeManagementColumns } from '../../Definitions/Enums/programme.management.columns.enum';
// import { ProgrammeManagementSlColumns } from '../../Definitions/Enums/programme.management.sl.columns.enum';
// import { ProgrammeManagementComponent } from '../../Components/SLCFProgrammeManagement/SLCFProgrammeManagementComponent';
// import { ROUTES } from '../../Config/uiRoutingConfig';

// const SLCFProgrammeManagement = () => {
//   const navigate = useNavigate();
//   const { t } = useTranslation(['common', 'projectList']);

//   const visibleColumns = [
//     ProgrammeManagementSlColumns.title,
//     ProgrammeManagementSlColumns.company,
//     ProgrammeManagementSlColumns.projectCategory,
//     ProgrammeManagementSlColumns.projectProposalStage,
//     ProgrammeManagementSlColumns.projectStatus,
//     ProgrammeManagementSlColumns.creditBalance,
//     ProgrammeManagementSlColumns.purposeOfCreditDevelopment,
//     ProgrammeManagementSlColumns.creditRetired,
//     ProgrammeManagementSlColumns.certifierId,
//     ProgrammeManagementSlColumns.serialNo,
//     ProgrammeManagementSlColumns.action,
//   ];

//   const onNavigateToProgrammeView = (record: any) => {
//     navigate(ROUTES.PROGRAMME_DETAILS_BY_REF_ID(record.refId), { state: { record } });
//   };

//   const onClickAddProgramme = () => {
//     navigate(ROUTES.ADD_PROGRAMME);
//   };

//   const onClickAddInvestment = () => {
//     navigate(ROUTES.ADD_INVESTMENT_TO_PROGRAMME);
//   };

//   return (
//     <SLCFProgrammeManagementComponent
//       t={t}
//       visibleColumns={visibleColumns}
//       onNavigateToProgrammeView={onNavigateToProgrammeView}
//       onClickAddProgramme={onClickAddProgramme}
//       enableAddProgramme
//       useAbilityContext={useAbilityContext}
//     ></SLCFProgrammeManagementComponent>
//   );
// };

// export default SLCFProgrammeManagement;

export {}

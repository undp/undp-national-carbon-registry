import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAbilityContext } from '../../Casl/Can';
import { ProgrammeManagementColumns } from '../../Definitions/Enums/programme.management.columns.enum';
import { ProgrammeManagementSlColumns } from '../../Definitions/Enums/programme.management.sl.columns.enum';
import { ProgrammeManagementComponent } from '../../Components/ProgrammeManagement/ProgrammeManagementComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const ProgrammeManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'projectList']);

  const visibleColumns = [
    ProgrammeManagementSlColumns.title,
    ProgrammeManagementSlColumns.company,
    ProgrammeManagementSlColumns.sector,
    ProgrammeManagementSlColumns.sectoralScope,
    ProgrammeManagementSlColumns.projectProposalStage,
    ProgrammeManagementSlColumns.authorizationId,
    ProgrammeManagementSlColumns.projectCreatedDate,
    // ProgrammeManagementSlColumns.projectStatus,
    ProgrammeManagementSlColumns.creditBalance,
    ProgrammeManagementSlColumns.purposeOfCreditDevelopment,
    ProgrammeManagementSlColumns.creditRetired,
    ProgrammeManagementSlColumns.projectId,
    // ProgrammeManagementSlColumns.certifierId,
    // ProgrammeManagementSlColumns.serialNo,
    ProgrammeManagementSlColumns.action,
  ];

  const onNavigateToProgrammeView = (record: any) => {
    navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(record.refId), { state: { record } });
  };

  const onClickAddProgramme = () => {
    navigate(ROUTES.ADD_PROGRAMME);
  };

  const onClickAddInvestment = () => {
    navigate(ROUTES.ADD_INVESTMENT_TO_PROGRAMME);
  };

  return (
    <ProgrammeManagementComponent
      t={t}
      visibleColumns={visibleColumns}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
      onClickAddProgramme={onClickAddProgramme}
      enableAddProgramme
      useAbilityContext={useAbilityContext}
    ></ProgrammeManagementComponent>
  );
};

export default ProgrammeManagement;

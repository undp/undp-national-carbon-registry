import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAbilityContext } from '../../Casl/Can';
import { ProgrammeManagementColumns } from '../../Definitions/Enums/programme.management.columns.enum';
import { ProgrammeManagementSlColumns } from '../../Definitions/Enums/programme.management.sl.columns.enum';
import { SLCFProgrammeManagementComponent } from '../../Components/SLCFProgramme/SLCFProgrammeManagement/SLCFProgrammeManagementComponent';

const SLCFProgrammeManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'projectList']);

  const visibleColumns = [
    ProgrammeManagementSlColumns.title,
    ProgrammeManagementSlColumns.company,
    ProgrammeManagementSlColumns.projectCategory,
    ProgrammeManagementSlColumns.projectProposalStage,
    ProgrammeManagementSlColumns.projectStatus,
    ProgrammeManagementSlColumns.creditBalance,
    ProgrammeManagementSlColumns.purposeOfCreditDevelopment,
    ProgrammeManagementSlColumns.creditRetired,
    ProgrammeManagementSlColumns.certifierId,
    ProgrammeManagementSlColumns.serialNo,
    ProgrammeManagementSlColumns.action,
  ];

  const onNavigateToProgrammeView = (record: any) => {
    navigate(`/programmeManagementSLCF/view/${record.programmeId}`, { state: { record } });
  };

  const onClickAddProgramme = () => {
    navigate('/programmeManagementSLCF/addProgramme');
  };

  const onClickAddInvestment = () => {
    navigate('/programmeManagementSLCF/addInvestment');
  };

  return (
    <SLCFProgrammeManagementComponent
      t={t}
      visibleColumns={visibleColumns}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
      onClickAddProgramme={onClickAddProgramme}
      enableAddProgramme
      useAbilityContext={useAbilityContext}
    ></SLCFProgrammeManagementComponent>
  );
};

export default SLCFProgrammeManagement;

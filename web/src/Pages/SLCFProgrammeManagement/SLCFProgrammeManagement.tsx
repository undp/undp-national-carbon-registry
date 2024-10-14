import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAbilityContext } from '../../Casl/Can';
import { ProgrammeManagementColumns } from '../../Definitions/Enums/programme.management.columns.enum';
import { SLCFProgrammeManagementComponent } from '../../Components/SLCFProgramme/SLCFProgrammeManagement/SLCFProgrammeManagementComponent';

const SLCFProgrammeManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'programme']);

  const visibleColumns = [
    ProgrammeManagementColumns.title,
    ProgrammeManagementColumns.company,
    ProgrammeManagementColumns.sector,
    ProgrammeManagementColumns.currentStage,
    ProgrammeManagementColumns.creditBalance,
    ProgrammeManagementColumns.creditTransferred,
    ProgrammeManagementColumns.certifierId,
    ProgrammeManagementColumns.serialNo,
    ProgrammeManagementColumns.emissionReductionExpected,
    ProgrammeManagementColumns.emissionReductionAchievedandCreditIssued,
    ProgrammeManagementColumns.action,
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

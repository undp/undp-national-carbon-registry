import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// import { CreditTransferComponent } from './creditTransfersComponent';
import { CreditRetirementSlComponent } from '../../Components/SLCFProgramme/Retirements/creditRetirementManagementSlComponent';

const SLCFRetirement = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'creditTransfer', 'programme', 'view']);

  const onNavigateToProgrammeView = (programmeId: any) => {
    navigate('/programmeManagement/view/' + programmeId);
  };

  return (
    <CreditRetirementSlComponent
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
    ></CreditRetirementSlComponent>
  );
};

export default SLCFRetirement;

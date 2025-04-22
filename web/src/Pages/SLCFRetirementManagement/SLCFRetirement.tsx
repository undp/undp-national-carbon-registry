import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditRetirementSlComponent } from '../../Components/Retirements/creditRetirementManagementSlComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const SLCFRetirement = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'creditTransfer', 'programme', 'view']);

  const onNavigateToProgrammeView = (programmeId: any) => {
    navigate(ROUTES.VIEW_PROGRAMME + programmeId);
  };

  return (
    <CreditRetirementSlComponent
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
    ></CreditRetirementSlComponent>
  );
};

export default SLCFRetirement;

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { InvestmentManagementComponent } from '../../Components/Investment/InvestmentManagement/investmentManagementComponent';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useSettingsContext } from '../../Context/SettingsContext/settingsContext';

const InvestmentManagement = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common', 'programme', 'creditTransfer', 'view']);

  const onNavigateToProgrammeView = (programmeId: any) => {
    navigate('/programmeManagement/view/' + programmeId);
  };
  const onNavigateToInvestmentCreation = () => {
    navigate('/investmentManagement/addInvestment', { state: { ownership: true } });
  };
  return (
    <InvestmentManagementComponent
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
      useUserContext={useUserContext}
      useSettingsContext={useSettingsContext}
      onClickAddOwnership={onNavigateToInvestmentCreation}
      enableAddOwnership={true}
    ></InvestmentManagementComponent>
  );
};

export default InvestmentManagement;

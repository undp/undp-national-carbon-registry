import { InvestmentCreationComponent } from '@undp/carbon-library';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useTranslation } from 'react-i18next';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useSettingsContext } from '../../Context/SettingsContext/settingsContext';

const AddInvestmentComponent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'programme']);

  const onNavigateToProgrammeView = (id: string) => {
    navigate('/programmeManagement/view/' + id);
  };

  const onNavigateToProgrammeManagementView = () => {
    navigate('/programmeManagement/viewAll');
  };

  return (
    <InvestmentCreationComponent
      t={t}
      useConnection={useConnection}
      userInfoState={useUserContext}
      useLocation={useLocation}
      useSettingsContext={useSettingsContext}
      onNavigateToProgrammeManagementView={onNavigateToProgrammeManagementView}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
    ></InvestmentCreationComponent>
  );
};

export default AddInvestmentComponent;

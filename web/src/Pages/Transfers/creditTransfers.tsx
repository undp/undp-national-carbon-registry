import { useNavigate } from 'react-router-dom';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useSettingsContext } from '../../Context/SettingsContext/settingsContext';
import { CreditTransferComponent } from '@undp/carbon-library';

const CreditTransfer = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'creditTransfer', 'programme', 'view']);

  const onNavigateToProgrammeView = (programmeId: any) => {
    navigate('/programmeManagement/view', { state: { id: programmeId } });
  };

  return (
    <CreditTransferComponent
      useConnection={useConnection}
      useUserContext={useUserContext}
      useSettingsContext={useSettingsContext}
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
    ></CreditTransferComponent>
  );
};

export default CreditTransfer;

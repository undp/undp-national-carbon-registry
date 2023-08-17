import { NdcActionManagementComponent } from '@undp/carbon-library';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NdcActionManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['ndcAction']);

  const onNavigateToNdcManagementView = (record: any) => {
    navigate('/ndcManagement/view', { state: { record } });
  };

  const onNavigateToProgrammeManagementView = (programmeId: any) => {
    navigate('/programmeManagement/view', { state: { id: programmeId } });
  };

  return (
    <NdcActionManagementComponent
      t={t}
      useConnection={useConnection}
      useUserContext={useUserContext}
      onNavigateToNdcManagementView={onNavigateToNdcManagementView}
      onNavigateToProgrammeManagementView={onNavigateToProgrammeManagementView}
    ></NdcActionManagementComponent>
  );
};

export default NdcActionManagement;

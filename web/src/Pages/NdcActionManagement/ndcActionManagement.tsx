import { NdcActionManagementComponent } from '@undp/carbon-library';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NdcActionManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['ndcAction']);

  const onNavigateToNdcManagementView = (record: any) => {
    navigate('/ndcManagement/view', { state: { record } });
  };

  const onNavigateToProgrammeManagementView = (programmeId: any) => {
    navigate('/programmeManagement/view/' + programmeId);
  };

  return (
    <NdcActionManagementComponent
      t={t}
      onNavigateToNdcManagementView={onNavigateToNdcManagementView}
      onNavigateToProgrammeManagementView={onNavigateToProgrammeManagementView}
    ></NdcActionManagementComponent>
  );
};

export default NdcActionManagement;

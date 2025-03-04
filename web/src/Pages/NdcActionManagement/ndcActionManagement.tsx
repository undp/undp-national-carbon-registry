import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NdcActionManagementComponent } from '../../Components/NdcActions/NdcActionManagement/ndcActionManagementComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const NdcActionManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['ndcAction']);

  const onNavigateToNdcManagementView = (record: any) => {
    navigate(ROUTES.VIEW_NDC, { state: { record } });
  };

  const onNavigateToProgrammeManagementView = (programmeId: any) => {
    navigate(ROUTES.VIEW_PROGRAMMES + programmeId);
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

import { NdcActionViewComponent } from '@undp/carbon-library';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { linkDocVisible, uploadDocUserPermission } from '../../Casl/documentsPermission';
import { getSdgGoalImages } from '../../Definitions/InterfacesAndType/ndcAction.definitions';

const NdcActionView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['ndcAction']);
  const sdgGoalImages = getSdgGoalImages();

  const onNavigateToNdcManagementView = (record: any) => {
    navigate('/ndcManagement/viewAll', { replace: true });
  };

  return (
    <NdcActionViewComponent
      useConnection={useConnection}
      linkDocVisible={linkDocVisible}
      uploadDocUserPermission={uploadDocUserPermission}
      useUserContext={useUserContext}
      useLocation={useLocation}
      onNavigateToNdcManagementView={onNavigateToNdcManagementView}
      t={t}
      sdgGoalImages={sdgGoalImages}
    ></NdcActionViewComponent>
  );
};

export default NdcActionView;

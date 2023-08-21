import {
  AddNdcActionComponent,
  NdcActionManagementComponent,
  ProgrammeCreationComponent,
} from '@undp/carbon-library';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSdgGoalImages } from '../../Definitions/InterfacesAndType/ndcAction.definitions';

const AddNDCAction = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'ndcAction']);
  const sdgGoalImages = getSdgGoalImages();

  const onNavigateToProgrammeManagementView = (programmeId: any) => {
    navigate('/programmeManagement/viewAll', { state: { id: programmeId } });
  };

  const onNavigateToProgrammeView = (programmeDetails: any) => {
    navigate('/programmeManagement/view', { state: { record: programmeDetails } });
  };

  return (
    <AddNdcActionComponent
      t={t}
      useLocation={useLocation}
      useConnection={useConnection}
      useUserContext={useUserContext}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
      onNavigateToProgrammeManagementView={onNavigateToProgrammeManagementView}
      sdgGoalImages={sdgGoalImages}
    ></AddNdcActionComponent>
  );
};

export default AddNDCAction;

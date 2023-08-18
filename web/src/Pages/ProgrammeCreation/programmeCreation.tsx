import { ProgrammeCreationComponent } from '@undp/carbon-library';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AddProgrammeComponent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['ndcAction']);

  const onNavigateToProgrammeView = () => {
    navigate('/programmeManagement/view');
  };

  return (
    <ProgrammeCreationComponent
      useUserContext={useUserContext}
      useConnection={useConnection}
      useLocation={useLocation}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
      t={t}
    ></ProgrammeCreationComponent>
  );
};

export default AddProgrammeComponent;

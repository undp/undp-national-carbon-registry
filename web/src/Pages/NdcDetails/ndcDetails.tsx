import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NdcDetailsComponent } from '@undp/carbon-library';

const NdcDetails = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['ndc']);

  return (
    <NdcDetailsComponent
      t={t}
      useConnection={useConnection}
      useUserContext={useUserContext}
    ></NdcDetailsComponent>
  );
};

export default NdcDetails;

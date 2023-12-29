import { GHGEmissionsComponent } from '@undp/carbon-library';
import { useTranslation } from 'react-i18next';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';

const GhgEmissions = () => {
  const { t } = useTranslation(['ghgInventory']);
  return (
    <GHGEmissionsComponent
      t={t}
      useConnection={useConnection}
      useUserContext={useUserContext}
    ></GHGEmissionsComponent>
  );
};

export default GhgEmissions;

import { GHGProjectionsComponent } from '@undp/carbon-library';
import { useTranslation } from 'react-i18next';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';

const GhgProjections = () => {
  const { t } = useTranslation(['ghgInventory']);
  return (
    <GHGProjectionsComponent
      t={t}
      useConnection={useConnection}
      useUserContext={useUserContext}
    ></GHGProjectionsComponent>
  );
};

export default GhgProjections;

import { GHGEmissionsComponent, useConnection, useUserContext } from '@undp/carbon-library';
import { useTranslation } from 'react-i18next';

const GhgEmissions = () => {
  const { t } = useTranslation(['ghgInventory']);
  return <GHGEmissionsComponent t={t}></GHGEmissionsComponent>;
};

export default GhgEmissions;

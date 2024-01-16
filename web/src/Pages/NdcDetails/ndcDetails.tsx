import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NdcDetailsComponent } from '@undp/carbon-library';

const NdcDetails = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['ndc']);

  return <NdcDetailsComponent t={t}></NdcDetailsComponent>;
};

export default NdcDetails;

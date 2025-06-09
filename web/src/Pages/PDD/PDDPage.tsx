import { useTranslation } from 'react-i18next';
import PDD from '../../Components/PDD/PDD';

const CMAFormPage = () => {
  const { i18n } = useTranslation(['common', 'PDD']);
  return <PDD translator={i18n} />;
};

export default CMAFormPage;

import { useTranslation } from 'react-i18next';
import { CreditBalanceTableComponent } from './Components/creditBalanceTable';
import './creditPageStyles.scss';

export const CreditBalancePage = () => {
  const { t } = useTranslation(['creditPages']);
  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <div className="body-title">{t('creditBalance')}</div>
          <CreditBalanceTableComponent t={t} />
        </div>
      </div>
    </div>
  );
};

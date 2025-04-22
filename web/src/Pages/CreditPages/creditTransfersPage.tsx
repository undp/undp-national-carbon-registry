import { useTranslation } from 'react-i18next';
import { CreditTransfersTableComponent } from './Components/creditTransfersTable';
import './creditPageStyles.scss';

export const CreditTransfersPage = () => {
  const { t } = useTranslation(['creditPages']);

  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <div className="body-title">{t('creditTranfers')}</div>
          <CreditTransfersTableComponent t={t} />
        </div>
      </div>
    </div>
  );
};

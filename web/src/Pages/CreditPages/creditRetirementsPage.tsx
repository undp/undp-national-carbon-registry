import { useTranslation } from 'react-i18next';
import { CreditRetirementsTableComponent } from './Components/creditRetirementsTable';
import './creditPageStyles.scss';

export const CreditRetirementsPage = () => {
  const { t } = useTranslation(['creditPages']);

  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <div className="body-title">{t('creditRetirements')}</div>
          <CreditRetirementsTableComponent t={t} />
        </div>
      </div>
    </div>
  );
};

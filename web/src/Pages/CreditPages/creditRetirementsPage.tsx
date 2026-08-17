import { useTranslation } from 'react-i18next';
import { CreditRetirementsTableComponent } from './Components/creditRetirementsTable';
import { TimedPageInfoTitle } from '../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle';
import './creditPageStyles.scss';

export const CreditRetirementsPage = () => {
  const { t } = useTranslation(['creditPages']);

  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <TimedPageInfoTitle
            title={t('creditRetirements')}
            description={t('creditRetirementsPageDescription', {
              defaultValue:
                'Review retired credit records, including projects, organizations, amounts, dates, and retirement status.',
            })}
            infoButtonLabel={t('showCreditRetirementsPageDescription', {
              defaultValue: 'Show information about Credit Retirements',
            })}
          />
          <CreditRetirementsTableComponent t={t} />
        </div>
      </div>
    </div>
  );
};

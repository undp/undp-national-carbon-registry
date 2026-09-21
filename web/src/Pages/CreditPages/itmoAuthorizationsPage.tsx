import { useTranslation } from 'react-i18next';
import { CreditItmoAuthorizationsTableComponent } from './Components/itmoAuthorizationsTable';
import { TimedPageInfoTitle } from '../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle';
import './creditPageStyles.scss';

export const ItmoAuthorizationsPage = () => {
  const { t } = useTranslation(['creditPages']);

  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <TimedPageInfoTitle
            title={t('itmoAuthorizations')}
            description={t('creditItmoAuthorizationsPageDescription', {
              defaultValue:
                'Review ITMO authorization requests, including projects, organizations, cooperative approaches, amounts, dates, and status.',
            })}
            infoButtonLabel={t('showCreditItmoAuthorizationsPageDescription', {
              defaultValue: 'Show information about ITMO Authorizations',
            })}
          />
          <CreditItmoAuthorizationsTableComponent t={t} />
        </div>
      </div>
    </div>
  );
};

import { useTranslation } from 'react-i18next';
import { CreditIssuanceTableComponent } from './Components/creditIssuanceTable';
import { TimedPageInfoTitle } from '../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle';
import './creditPageStyles.scss';

export const CreditIssuancePage = () => {
  const { t } = useTranslation(['creditPages']);

  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <TimedPageInfoTitle
            title={t('creditIssuance')}
            description={t('creditIssuancePageDescription', {
              defaultValue:
                'Review issued credit blocks, including their project, organization, vintage, amount, and issuance history.',
            })}
            infoButtonLabel={t('showCreditIssuancePageDescription', {
              defaultValue: 'Show information about Credit Issuance',
            })}
          />
          <CreditIssuanceTableComponent t={t} />
        </div>
      </div>
    </div>
  );
};

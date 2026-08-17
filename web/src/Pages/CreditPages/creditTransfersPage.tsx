import { useTranslation } from 'react-i18next';
import { CreditTransfersTableComponent } from './Components/creditTransfersTable';
import { TimedPageInfoTitle } from '../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle';
import './creditPageStyles.scss';

export const CreditTransfersPage = () => {
  const { t } = useTranslation(['creditPages']);

  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <TimedPageInfoTitle
            title={t('creditTranfers')}
            description={t('creditTransfersPageDescription', {
              defaultValue:
                'Track credit transfers between organizations, including amounts, serial numbers, dates, and participants.',
            })}
            infoButtonLabel={t('showCreditTransfersPageDescription', {
              defaultValue: 'Show information about Credit Transfers',
            })}
          />
          <CreditTransfersTableComponent t={t} />
        </div>
      </div>
    </div>
  );
};

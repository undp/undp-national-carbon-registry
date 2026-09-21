import { useTranslation } from 'react-i18next';
import { CreditBlockListTableComponent } from './Components/creditBlockList';
import { TimedPageInfoTitle } from '../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle';
import './creditPageStyles.scss';

export const CreditBlockListPage = () => {
  const { t } = useTranslation(['creditPages']);

  return (
    <div className="content-container credit-management">
      <div className="credit-title-bar">
        <div className="title-bar">
          <TimedPageInfoTitle
            title={t('creditBlockList')}
            description={t('creditExplorerPageDescription', {
              defaultValue:
                'Search credit blocks by serial number and filter results by project, organization, and status.',
            })}
            infoButtonLabel={t('showCreditExplorerPageDescription', {
              defaultValue: 'Show information about Credit Explorer',
            })}
          />
          <CreditBlockListTableComponent t={t} />
        </div>
      </div>
    </div>
  );
};

import { useTranslation } from 'react-i18next';
import './OrganisationStatus.scss';

export interface OrganisationStatusProps {
  organisationStatus: number;
}

const OrganisationStatus = (props: OrganisationStatusProps) => {
  const { organisationStatus } = props;

  const { t } = useTranslation(['companyProfile']);

  return organisationStatus === 1 ? (
    <div className="mg-top-1 organisation-status-active">{t('companyProfile:activeStatus')}</div>
  ) : (
    <div className="mg-top-1 organisation-status-deauthorised">
      {t('companyProfile:deauthorisedStatus')}
    </div>
  );
};

export default OrganisationStatus;

import React from 'react';
import './organisationSlStatus.scss';

export interface OrganisationStatusProps {
  organisationStatus: number;
  t: any;
}

export const OrganisationSlStatus = (props: OrganisationStatusProps) => {
  const { organisationStatus, t } = props;
  let orgState = (
    <div className="organisation-sl-status-deauthorised">
      {t('companyProfile:deauthorisedStatus')}
    </div>
  );

  switch (organisationStatus) {
    case 1:
      orgState = (
        <div className="organisation-sl-status-active">{t('companyProfile:activeStatus')}</div>
      );
      break;

    case 2:
      orgState = (
        <div className="organisation-sl-status-pending">{t('companyProfile:pendingStatus')}</div>
      );
      break;

    case 3:
      orgState = (
        <div className="organisation-sl-status-rejected">{t('companyProfile:rejectedStatus')}</div>
      );
      break;

    default:
      break;
  }

  return orgState;
};

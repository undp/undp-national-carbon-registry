import React from 'react';
import './organisationStatus.scss';

export interface OrganisationStatusProps {
  organisationStatus: number;
  t: any;
}

export const OrganisationStatus = (props: OrganisationStatusProps) => {
  const { organisationStatus, t } = props;
  let orgState = (
    <div className="mg-top-1 organisation-status-deauthorised">
      {t('companyProfile:deauthorisedStatus')}
    </div>
  );

  switch (organisationStatus) {
    case 1:
      orgState = (
        <div className="mg-top-1 organisation-status-active">
          {t('companyProfile:activeStatus')}
        </div>
      );
      break;

    case 2:
      orgState = (
        <div className="mg-top-1 organisation-status-pending">
          {t('companyProfile:pendingStatus')}
        </div>
      );
      break;

    case 3:
      orgState = (
        <div className="mg-top-1 organisation-status-rejected">
          {t('companyProfile:rejectedStatus')}
        </div>
      );
      break;

    default:
      break;
  }

  return orgState;
};

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { UserProfileComponent } from 'carbon-library';
import { AbilityContext } from '../../Casl/Can';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['companyProfile']);
  const { get } = useConnection();

  const onNavigateUpdateUser = (organisationDetails: any, userDetails: any) => {
    navigate('/userManagement/updateUser', {
      state: {
        record: {
          company: organisationDetails,
          ...userDetails,
        },
      },
    });
  };

  const onNavigateToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <UserProfileComponent
      t={t}
      i18n={i18n}
      useConnection={useConnection}
      onNavigateUpdateUser={onNavigateUpdateUser}
      onNavigateLogin={onNavigateToLogin}
      useUserContext={useUserContext}
    ></UserProfileComponent>
  );
};

export default CompanyProfile;

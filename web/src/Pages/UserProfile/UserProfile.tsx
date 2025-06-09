import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserProfileComponent } from '../../Components/User/UserProfile/userProfileComponent';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['userProfile', 'companyDetails']);

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
      onNavigateUpdateUser={onNavigateUpdateUser}
      onNavigateLogin={onNavigateToLogin}
    ></UserProfileComponent>
  );
};

export default CompanyProfile;

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserProfileComponent } from '../../Components/User/UserProfile/userProfileComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['userProfile', 'companyDetails', 'companyRoles']);

  const onNavigateUpdateUser = (organisationDetails: any, userDetails: any) => {
    navigate(ROUTES.UPDATE_USER, {
      state: {
        record: {
          company: organisationDetails,
          ...userDetails,
        },
      },
    });
  };

  const onNavigateToLogin = () => {
    navigate(ROUTES.LOGIN, { replace: true });
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

import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAbilityContext } from '../../Casl/Can';
import { AddNewUserComponent } from '../../Components/User/AddNewUser/addNewUserComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const AddUser = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['addUser', 'passwordReset', 'userProfile']);

  const onNavigateToUserManagement = () => {
    navigate(ROUTES.VIEW_USERS, { replace: true });
  };

  const onNavigateToLogin = () => {
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <AddNewUserComponent
      t={t}
      onNavigateToUserManagement={onNavigateToUserManagement}
      onNavigateLogin={onNavigateToLogin}
      useLocation={useLocation}
      useAbilityContext={useAbilityContext}
      themeColor="#16b1ff"
    ></AddNewUserComponent>
  );
};

export default AddUser;

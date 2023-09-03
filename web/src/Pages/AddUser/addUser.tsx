import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { AddNewUserComponent } from '@undp/carbon-library';
import { useAbilityContext } from '../../Casl/Can';

const AddUser = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['addUser', 'passwordReset', 'userProfile']);

  const onNavigateToUserManagement = () => {
    navigate('/userManagement/viewAll', { replace: true });
  };

  const onNavigateToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <AddNewUserComponent
      t={t}
      onNavigateToUserManagement={onNavigateToUserManagement}
      onNavigateLogin={onNavigateToLogin}
      useConnection={useConnection}
      useUserContext={useUserContext}
      useLocation={useLocation}
      useAbilityContext={useAbilityContext}
      themeColor="#16b1ff"
    ></AddNewUserComponent>
  );
};

export default AddUser;

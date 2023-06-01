import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { AddNewUserComponent } from 'carbon-library';
import { AbilityContext } from '../../Casl/Can';

const AddUser = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['addCompany']);

  const maximumImageSize = process.env.MAXIMUM_IMAGE_SIZE
    ? parseInt(process.env.MAXIMUM_IMAGE_SIZE)
    : 3145728;

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
      AbilityContext={AbilityContext}
    ></AddNewUserComponent>
  );
};

export default AddUser;

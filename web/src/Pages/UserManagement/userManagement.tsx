import { useNavigate } from 'react-router-dom';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useAbilityContext } from '../../Casl/Can';
import { UserManagementComponent, UserManagementColumns } from '@undp/carbon-library';
import { useTranslation } from 'react-i18next';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';

const UserManagement = () => {
  const navigate = useNavigate();
  const { userInfoState } = useUserContext();
  const { t } = useTranslation(['company']);

  const visibleColumns = [
    UserManagementColumns.logo,
    UserManagementColumns.name,
    UserManagementColumns.email,
    UserManagementColumns.phoneNo,
    UserManagementColumns.company,
    UserManagementColumns.companyRole,
    UserManagementColumns.role,
    UserManagementColumns.actions,
  ];

  const navigateToUpdateUser = (record: any) => {
    navigate('/userManagement/updateUser', { state: { record } });
  };

  const navigateToAddNewUser = () => {
    navigate('/userManagement/addUSer');
  };

  return (
    <UserManagementComponent
      t={t}
      useAbilityContext={useAbilityContext}
      useConnection={useConnection}
      visibleColumns={visibleColumns}
      onNavigateToUpdateUser={navigateToUpdateUser}
      onClickAddUser={navigateToAddNewUser}
      userInfoState={userInfoState}
    ></UserManagementComponent>
  );
};

export default UserManagement;

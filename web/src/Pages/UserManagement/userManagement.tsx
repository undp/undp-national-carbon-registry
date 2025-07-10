import { useNavigate } from 'react-router-dom';
import { useAbilityContext } from '../../Casl/Can';
import { useTranslation } from 'react-i18next';
import { UserManagementColumns } from '../../Definitions/Enums/user.management.columns.enum';
import { UserManagementComponent } from '../../Components/User/UserManagement/userManagementComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const UserManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['company', 'companyRoles']);

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
    navigate(ROUTES.UPDATE_USER, { state: { record } });
  };

  const navigateToAddNewUser = () => {
    navigate(ROUTES.ADD_NEW_USER);
  };

  return (
    <UserManagementComponent
      t={t}
      useAbilityContext={useAbilityContext}
      visibleColumns={visibleColumns}
      onNavigateToUpdateUser={navigateToUpdateUser}
      onClickAddUser={navigateToAddNewUser}
    ></UserManagementComponent>
  );
};

export default UserManagement;

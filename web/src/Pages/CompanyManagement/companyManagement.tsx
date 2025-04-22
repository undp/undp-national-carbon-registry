import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAbilityContext } from '../../Casl/Can';
import { CompanyManagementColumns } from '../../Definitions/Enums/company.management.columns.enum';
import { CompanyManagementComponent } from '../../Components/Company/CompanyManagement/companyManagementComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const CompanyManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['company', 'companyProfile', 'companyRoles']);

  const visibleColumns = [
    CompanyManagementColumns.logo,
    CompanyManagementColumns.name,
    CompanyManagementColumns.taxId,
    CompanyManagementColumns.companyRole,
    CompanyManagementColumns.programmeCount,
    CompanyManagementColumns.companyState,
    CompanyManagementColumns.action,
  ];

  const navigateToCompanyProfile = (record: any) => {
    navigate(ROUTES.VIEW_ORGANIZATION_PROFILE, { state: { record } });
  };

  const navigateToAddNewCompany = () => {
    navigate(ROUTES.ADD_ORGANIZATION);
  };

  return (
    <CompanyManagementComponent
      t={t}
      useAbilityContext={useAbilityContext}
      visibleColumns={visibleColumns}
      onNavigateToCompanyProfile={navigateToCompanyProfile}
      onClickAddCompany={navigateToAddNewCompany}
    ></CompanyManagementComponent>
  );
};

export default CompanyManagement;

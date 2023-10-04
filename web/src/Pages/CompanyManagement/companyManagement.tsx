import { useNavigate } from 'react-router-dom';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useTranslation } from 'react-i18next';
import { useAbilityContext } from '../../Casl/Can';
import { CompanyManagementComponent, CompanyManagementColumns } from '@undp/carbon-library';

const CompanyManagement = () => {
  const navigate = useNavigate();
  const { post } = useConnection();
  const { t } = useTranslation(['company', 'companyProfile']);

  const visibleColumns = [
    CompanyManagementColumns.logo,
    CompanyManagementColumns.name,
    CompanyManagementColumns.taxId,
    CompanyManagementColumns.companyRole,
    CompanyManagementColumns.programmeCount,
    CompanyManagementColumns.companyState,
  ];

  const navigateToCompanyProfile = (record: any) => {
    navigate('/companyProfile/view', { state: { record } });
  };

  const navigateToAddNewCompany = () => {
    navigate('/companyManagement/addCompany');
  };

  return (
    <CompanyManagementComponent
      t={t}
      useAbilityContext={useAbilityContext}
      post={post}
      visibleColumns={visibleColumns}
      onNavigateToCompanyProfile={navigateToCompanyProfile}
      onClickAddCompany={navigateToAddNewCompany}
    ></CompanyManagementComponent>
  );
};

export default CompanyManagement;

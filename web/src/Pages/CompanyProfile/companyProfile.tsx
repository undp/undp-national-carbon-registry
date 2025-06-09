import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAbilityContext } from '../../Casl/Can';
import { CompanyProfileComponent } from '../../Components/Company/CompanyProfile/companyProfileComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['companyProfile', 'companyDetails', 'companyRoles']);

  const onNavigateToCompanyManagement = () => {
    navigate(ROUTES.VIEW_ORGANIZATIONS);
  };

  const onNavigateToCompanyEdit = (companyDetails: any) => {
    navigate(ROUTES.UPDATE_ORGANIZATION, { state: { record: companyDetails } });
  };

  return (
    <CompanyProfileComponent
      t={t}
      useAbilityContext={useAbilityContext}
      useLocation={useLocation}
      onNavigateToCompanyManagement={onNavigateToCompanyManagement}
      onNavigateToCompanyEdit={onNavigateToCompanyEdit}
      regionField
    ></CompanyProfileComponent>
  );
};

export default CompanyProfile;

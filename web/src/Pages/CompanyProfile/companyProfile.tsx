import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAbilityContext } from '../../Casl/Can';
import { CompanyProfileComponent } from '../../Components/Company/CompanyProfile/companyProfileComponent';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['companyProfile', 'companyDetails']);

  const onNavigateToCompanyManagement = () => {
    navigate('/companyManagement/viewAll');
  };

  const onNavigateToCompanyEdit = (companyDetails: any) => {
    navigate('/companyManagement/updateCompany', { state: { record: companyDetails } });
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

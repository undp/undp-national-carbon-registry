import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { InvestmentCreationComponent } from '../../Components/Investment/AddNewInvestment/investmentCreationComponent';

const AddInvestmentComponent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'programme']);

  const onNavigateToProgrammeView = (id: string) => {
    navigate('/programmeManagement/view/' + id);
  };

  const onNavigateToProgrammeManagementView = () => {
    navigate('/programmeManagement/viewAll');
  };

  const onNavigateToInvestmentManagementView = () => {
    navigate('/investmentManagement/viewAll');
  };

  return (
    <InvestmentCreationComponent
      t={t}
      useLocation={useLocation}
      onNavigateToProgrammeManagementView={onNavigateToProgrammeManagementView}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
      onNavigateToInvestmentManagementView={onNavigateToInvestmentManagementView}
    ></InvestmentCreationComponent>
  );
};

export default AddInvestmentComponent;

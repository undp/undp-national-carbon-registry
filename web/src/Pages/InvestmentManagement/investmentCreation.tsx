import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { InvestmentCreationComponent } from '../../Components/Investment/AddNewInvestment/investmentCreationComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const AddInvestmentComponent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'programme']);

  const onNavigateToProgrammeView = (id: string) => {
    navigate(ROUTES.VIEW_PROGRAMME + id);
  };

  const onNavigateToProgrammeManagementView = () => {
    navigate(ROUTES.VIEW_PROGRAMMES);
  };

  const onNavigateToInvestmentManagementView = () => {
    navigate(ROUTES.VIEW_INVESTMENTS);
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

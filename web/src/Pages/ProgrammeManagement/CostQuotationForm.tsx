import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AddCostQuotationForm } from '../../Components/AddCostQuotation/AddCostQuotationForm';
import { ROUTES } from '../../Config/uiRoutingConfig';

const CostQuotationForm = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'costQuotation']);
  const { id } = useParams();

  const onNavigateToProgrammeManagementView = () => {
    navigate(ROUTES.VIEW_PROGRAMMES);
  };

  return (
    <AddCostQuotationForm
      translator={i18n}
      useLocation={useLocation}
      onNavigateToProgrammeView={onNavigateToProgrammeManagementView}
      programmeId={id}
    ></AddCostQuotationForm>
  );
};

export default CostQuotationForm;

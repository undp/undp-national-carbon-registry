import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AddCostQuotationForm } from '../../Components/SLCFProgramme/AddCostQuotation/AddCostQuotationForm';

const SLCFCostQuotationForm = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'costQuotation']);
  const { id } = useParams();

  const onNavigateToProgrammeManagementView = () => {
    navigate('/programmeManagement/viewAll');
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

export default SLCFCostQuotationForm;

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreditTransferComponent } from './creditTransfersComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const CreditTransfer = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'creditTransfer', 'programme', 'view']);

  const onNavigateToProgrammeView = (programmeId: any) => {
    navigate(ROUTES.VIEW_PROGRAMME + programmeId);
  };

  return (
    <CreditTransferComponent
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
    ></CreditTransferComponent>
  );
};

export default CreditTransfer;

import { InvestmentManagementComponent } from '@undp/carbon-library';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const InvestmentManagement = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common', 'programme', 'creditTransfer', 'view']);

  const onNavigateToProgrammeView = (programmeId: any) => {
    navigate('/programmeManagement/view/' + programmeId);
  };

  return (
    <InvestmentManagementComponent
      translator={i18n}
      onNavigateToProgrammeView={onNavigateToProgrammeView}
    ></InvestmentManagementComponent>
  );
};

export default InvestmentManagement;

import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { VerificationReportComponent } from '../../Components/SLCFProgramme/VerificationReport/VerificationReportComponent';

const VerificationReport = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'verificationReport']);

  const onNavigateToProgrammeManagementView = () => {
    navigate('/programmeManagementSLCF/viewAll');
  };

  return (
    <VerificationReportComponent
      translator={i18n}
      useLocation={useLocation}
      onNavigateToProgrammeView={onNavigateToProgrammeManagementView}
    ></VerificationReportComponent>
  );
};

export default VerificationReport;

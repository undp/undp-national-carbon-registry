import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SLCFMonitoringReportComponent } from '../../Components/MonitoringReport/SLCFMonitoringReportComponent';
import { ROUTES } from '../../Config/uiRoutingConfig';

const MonitoringReport = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'monitoringReport']);

  const onNavigateToProgrammeManagementView = () => {
    navigate(ROUTES.VIEW_PROGRAMMES);
  };

  return (
    <SLCFMonitoringReportComponent
      translator={i18n}
      useLocation={useLocation}
      onNavigateToProgrammeView={onNavigateToProgrammeManagementView}
    ></SLCFMonitoringReportComponent>
  );
};

export default MonitoringReport;

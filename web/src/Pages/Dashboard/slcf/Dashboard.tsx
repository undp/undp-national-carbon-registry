import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import ButtonGroup from 'antd/lib/button/button-group';
import { DashboardComponent } from '../../../Components/Dashboard/DashboardViewComponent';

const SLCFDashboard = () => {
  const { t } = useTranslation(['dashboard']);
  return (
    <DashboardComponent
      Chart={Chart}
      t={t}
      ButtonGroup={ButtonGroup}
      Link={Link}
      isMultipleDashboardsVisible={false}
    ></DashboardComponent>
  );
};

export default SLCFDashboard;

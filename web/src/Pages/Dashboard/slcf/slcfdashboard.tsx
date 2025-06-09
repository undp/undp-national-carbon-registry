import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import ButtonGroup from 'antd/lib/button/button-group';
import { SLCFDashboardComponent } from '../../../Components/SLCFDashboard/slcfDashboardViewComponent';

const SLCFDashboard = () => {
  const { t } = useTranslation(['dashboard']);
  return (
    <SLCFDashboardComponent
      Chart={Chart}
      t={t}
      ButtonGroup={ButtonGroup}
      Link={Link}
      isMultipleDashboardsVisible={false}
    ></SLCFDashboardComponent>
  );
};

export default SLCFDashboard;

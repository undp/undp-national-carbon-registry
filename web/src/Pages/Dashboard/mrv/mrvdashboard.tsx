import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useTranslation } from 'react-i18next';
import { MrvDashboardComponent } from '@undp/carbon-library';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import ButtonGroup from 'antd/lib/button/button-group';

const MRVDashboard = () => {
  const { i18n } = useTranslation(['mrvdashboard']);
  return (
    <MrvDashboardComponent
      useConnection={useConnection}
      useUserContext={useUserContext}
      Link={Link}
      Chart={Chart}
      translator={i18n}
      ButtonGroup={ButtonGroup}
    ></MrvDashboardComponent>
  );
};

export default MRVDashboard;

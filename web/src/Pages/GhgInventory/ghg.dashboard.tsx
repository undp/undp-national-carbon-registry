import React from 'react';
// import { GHGDashboardComponent, useConnection, useUserContext } from '@undp/carbon-library';
import { useTranslation } from 'react-i18next';
import ButtonGroup from 'antd/lib/button/button-group';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';

const GHGDashboard = () => {
  const { t } = useTranslation(['ghgInventory']);
  // return (
  //   <GHGDashboardComponent
  //     t={t}
  //     ButtonGroup={ButtonGroup}
  //     Link={Link}
  //     Chart={Chart}
  //     isMultipleDashboardsVisible={true}
  //   ></GHGDashboardComponent>
  // );
};

export default GHGDashboard;

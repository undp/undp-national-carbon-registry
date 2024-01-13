import { Layout } from 'antd';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
const { Header, Sider, Content } = Layout;
import { Outlet } from 'react-router-dom';
import LayoutHeader from '../Header/layout.header';
import {
  ConfigurationSettingsType,
  Loading,
  useConnection,
  useSettingsContext,
} from '@undp/carbon-library';
import LayoutSider from '../Sider/layout.sider';
import './layout.scss';
import { PauseCircleFill } from 'react-bootstrap-icons';

const CustomLayout = (props: any) => {
  const { selectedKey } = props;
  const [collapsed, setCollapsed] = useState(false);
  const { get } = useConnection();
  const { isTransferFrozen, setTransferFrozen } = useSettingsContext();
  const { t } = useTranslation(['creditTransfer']);

  const getTranferFrozenStatus = async () => {
    const response = await get(
      `national/Settings/query?id=${ConfigurationSettingsType.isTransferFrozen}`
    );
    if (response && response.data) {
      setTransferFrozen(response.data);
    } else {
      setTransferFrozen(false);
    }
  };

  useEffect(() => {
    getTranferFrozenStatus();
  }, []);

  return (
    <div className="layout-main-container">
      {isTransferFrozen && (
        <div className="transfer-freeze-label">
          <span className="pause-circle">
            <PauseCircleFill size={25} className="pause-circle-icon" />
            {t('creditTransfer:allTransfersPausedLabelTxt')}
          </span>
        </div>
      )}
      <Layout hasSider>
        <LayoutSider selectedKey={selectedKey} collapsed={collapsed} />
        <Layout className="layout-container">
          <Header className="layout-header-container">
            <LayoutHeader onToggle={(val) => setCollapsed(val)} />
          </Header>
          <Content>
            <div className="layout-content-container">
              <Suspense fallback={<Loading />}>
                <Outlet />
              </Suspense>
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default CustomLayout;

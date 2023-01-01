import { Layout, Radio } from 'antd';
import { useState } from 'react';
const { Header, Sider, Content } = Layout;
import { Outlet } from 'react-router-dom';
import LayoutHeader from '../Header/layout.header';
import LayoutSider from '../Sider/layout.sider';
import './layout.scss';

const CustomLayout = (props: any) => {
  const { selectedKey } = props;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout-main-container">
      <Layout hasSider>
        <LayoutSider selectedKey={selectedKey} collapsed={collapsed} />
        <Layout className="layout-container">
          <Header className="layout-header-container">
            <LayoutHeader onToggle={(val) => setCollapsed(val)} />
          </Header>
          <Content>
            <div className="layout-content-container">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default CustomLayout;

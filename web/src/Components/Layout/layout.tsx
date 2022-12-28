import { Layout } from 'antd';
const { Header, Sider, Content } = Layout;
import { Outlet } from 'react-router-dom';
import LayoutHeader from '../Header/layout.header';
import LayoutSider from '../Sider/layout.sider';
import './layout.scss';

const CustomLayout = (props: any) => {
  const { selectedKey } = props;

  return (
    <div className="layout-main-container">
      <Layout hasSider>
        <LayoutSider selectedKey={selectedKey} />
        <Layout className="layout-container">
          <Header className="layout-header-container">
            <LayoutHeader />
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

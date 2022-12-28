import { useState } from 'react';
import { Menu, Layout } from 'antd';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import { Link, useNavigate } from 'react-router-dom';
import './layout.sider.scss';
import {
  AppstoreOutlined,
  DashboardOutlined,
  HomeOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { LayoutSiderProps } from '../../Definitions/InterfacesAndType/layout.sider.definitions';
import { useTranslation } from 'react-i18next';

const { Sider } = Layout;
const { SubMenu } = Menu;

const LayoutSider = (props: LayoutSiderProps) => {
  const { selectedKey } = props;
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { i18n, t } = useTranslation(['nav']);
  return (
    <Sider
      width={280}
      className="layout-sider-container"
      breakpoint="lg"
      // collapsedWidth="70"
      onCollapse={(col) => {
        setCollapsed(col);
      }}
    >
      <div className="layout-sider-div-container">
        <div
          className="layout-sider-heading-container"
          onClick={() => navigate('/dashboard', { replace: true })}
        >
          <div className="logo">
            <img src={sliderLogo} alt="slider-logo" />
          </div>
          <div className="title">{collapsed ? '' : 'CARBON'}</div>
          <div className="title-sub">{collapsed ? '' : 'REGISTRY'}</div>
        </div>
        <div className="layout-sider-menu-container">
          <Menu theme="light" mode="inline" defaultSelectedKeys={[selectedKey ?? 'dashboard']}>
            {/* <Menu.Item
              key="home"
              icon={!collapsed ? <HomeOutlined style={{ fontSize: '1.2rem' }} /> : ''}
            >
              <Link to="/dashboard">
                {collapsed ? <HomeOutlined style={{ fontSize: '2rem' }} /> : 'Home'}
              </Link>
            </Menu.Item> */}
            <Menu.Item
              key="dashboard"
              icon={!collapsed ? <DashboardOutlined style={{ fontSize: '1.2rem' }} /> : ''}
            >
              <Link to="/dashboard">
                {collapsed ? (
                  <DashboardOutlined style={{ fontSize: '2rem' }} />
                ) : (
                  t('nav:dashboard')
                )}
              </Link>
            </Menu.Item>
            <Menu.Item
              key="programmes"
              icon={!collapsed ? <AppstoreOutlined style={{ fontSize: '1.2rem' }} /> : ''}
            >
              <Link to="/programmeManagement/viewAll">
                {collapsed ? (
                  <AppstoreOutlined style={{ fontSize: '2rem' }} />
                ) : (
                  t('nav:programmes')
                )}
              </Link>
            </Menu.Item>
            <SubMenu
              key="companies"
              icon={!collapsed ? <ShopOutlined style={{ fontSize: '1.2rem' }} /> : ''}
              title={t('nav:companies')}
            >
              <Menu.Item key="view-company">
                <Link to="/companyManagement/viewAll">
                  {collapsed ? (
                    <UnorderedListOutlined style={{ fontSize: '2rem' }} />
                  ) : (
                    t('nav:viewAll')
                  )}
                </Link>
              </Menu.Item>
              <Menu.Item key="add-company">
                <Link to="/companyManagement/addCompany">
                  {collapsed ? (
                    <UnorderedListOutlined style={{ fontSize: '2rem' }} />
                  ) : (
                    t('nav:addNew')
                  )}
                </Link>
              </Menu.Item>
            </SubMenu>
            <SubMenu
              key="users"
              icon={!collapsed ? <UserOutlined style={{ fontSize: '1.2rem' }} /> : ''}
              title={t('nav:users')}
            >
              <Menu.Item key="view-user">
                <Link to="/userManagement/viewAll">
                  {collapsed ? (
                    <UnorderedListOutlined style={{ fontSize: '2rem' }} />
                  ) : (
                    t('nav:viewAll')
                  )}
                </Link>
              </Menu.Item>
              <Menu.Item key="add-user">
                <Link to="/userManagement/addUser">
                  {collapsed ? (
                    <UnorderedListOutlined style={{ fontSize: '2rem' }} />
                  ) : (
                    t('nav:addNew')
                  )}
                </Link>
              </Menu.Item>
            </SubMenu>
            {/* <Menu.Item
              style={{ marginTop: '25px' }}
              key="userManagement"
              icon={!collapsed ? <UserOutlined style={{ fontSize: '1.2rem' }} /> : ''}
            >
              <Link to="/userManagement">
                {collapsed ? <UserOutlined style={{ fontSize: '2rem' }} /> : 'User Management'}
              </Link>
            </Menu.Item> */}
          </Menu>
        </div>
      </div>
    </Sider>
  );
};

export default LayoutSider;

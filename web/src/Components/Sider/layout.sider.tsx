import { useState } from 'react';
import { Menu, Layout, MenuProps } from 'antd';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import { Link, useNavigate } from 'react-router-dom';
import './layout.sider.scss';
import * as Icon from 'react-bootstrap-icons';
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

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const LayoutSider = (props: LayoutSiderProps) => {
  const { selectedKey } = props;
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { i18n, t } = useTranslation(['nav']);

  const items: MenuItem[] = [
    getItem(t('nav:dashboard'), 'dashboard', <DashboardOutlined />),
    getItem(t('nav:programmes'), 'programmeManagement/viewAll', <AppstoreOutlined />),
    getItem(t('nav:companies'), 'companyManagement/viewAll', <ShopOutlined />),
    getItem(t('nav:users'), 'userManagement/viewAll', <UserOutlined />),
    // getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '8')]),
  ];

  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click', e);
    navigate('/' + e.key);
  };

  return (
    <Sider
      width={280}
      className="layout-sider-container"
      breakpoint={collapsed ? undefined : 'lg'}
      collapsed={collapsed}
      // collapsedWidth="70"
      // onCollapse={(col) => {
      //   setCollapsed(col);
      // }}
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
          <Menu
            theme="light"
            //defaultSelectedKeys={[selectedKey ?? 'dashboard']}
            selectedKeys={[selectedKey ? selectedKey : 'dashboard']}
            mode="inline"
            onClick={onClick}
            items={items}
          />
        </div>
      </div>
      <div
        className="toggle-nav-btn"
        onClick={() => {
          setCollapsed(!collapsed);
        }}
      >
        {collapsed ? <Icon.ArrowRight /> : <Icon.ArrowLeft />}
      </div>
    </Sider>
  );
};

export default LayoutSider;

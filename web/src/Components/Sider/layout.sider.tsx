import { useState } from 'react';
import { Menu, Layout, MenuProps } from 'antd';
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
  const { selectedKey, collapsed } = props;
  const navigate = useNavigate();
  // const [collapsed, setCollapsed] = useState(false);
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
            defaultSelectedKeys={[selectedKey ?? 'dashboard']}
            mode="inline"
            onClick={onClick}
            items={items}
          />
          {/* <Menu theme="light" mode="inline" defaultSelectedKeys={[selectedKey ?? 'dashboard']}>
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
          </Menu> */}
        </div>
      </div>
    </Sider>
  );
};

export default LayoutSider;

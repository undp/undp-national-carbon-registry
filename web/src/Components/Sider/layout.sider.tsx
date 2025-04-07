import { useEffect, useState } from "react";
import { Menu, Layout, MenuProps } from "antd";
import sliderLogo from "../../Assets/Images/logo-slider.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./layout.sider.scss";
import * as Icon from "react-bootstrap-icons";
import {
  AppstoreOutlined,
  DashboardOutlined,
  SettingOutlined,
  ShopOutlined,
  SplitCellsOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { LayoutSiderProps } from "../../Definitions/Definitions/layout.sider.definitions";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import { ROUTES } from "../../Config/uiRoutingConfig";

const { Sider } = Layout;
const { SubMenu } = Menu;

type MenuItem = {
  key: React.Key;
  icon?: React.ReactNode;
  label: React.ReactNode;
  children?: MenuItem[];
} | null;

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
  const { userInfoState } = useUserContext();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectKey, setSelectKey] = useState<any>(selectedKey);
  const { i18n, t } = useTranslation(["nav"]);

  const currentPage = location.pathname.replace(/^\/|\/$/g, "");

  const items: MenuItem[] = [
    getItem(t("nav:dashboard"), "dashboard", <DashboardOutlined />),
    getItem(
      t("nav:slcfprogrammes"),
      "programmeManagement/viewAllProjects",
      <AppstoreOutlined />
    ),
    getItem(
      t("nav:projectList"),
      "programmeManagement/viewAll",
      <UnorderedListOutlined />
    ),
    // getItem(t('nav:programmes'), 'programmeManagement/viewAll', <AppstoreOutlined />),
    // getItem(t('nav:cdmTransitionProjects'), 'cdmManagement/viewAll', <UnorderedListOutlined />),
    // getItem(t('nav:verra'), 'verraManagement/viewAll', <AppstoreOutlined />),
    // getItem(t('nav:goldStandards'), 'goldStandardManagement/viewAll', <AppstoreOutlined />),
    // getItem(t('nav:ndcActions'), 'ndcManagement/viewAll', <Icon.Clipboard2Data />),
    // getItem(t('nav:investments'), 'investmentManagement/viewAll', <Icon.Cash />),
    // getItem(t('nav:transfers'), 'creditTransfers/viewAll', <Icon.ArrowLeftRight />),
    getItem(t("nav:companies"), "companyManagement/viewAll", <ShopOutlined />),
    getItem(t("nav:users"), "userManagement/viewAll", <UserOutlined />),
  ];

  if (
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.PROJECT_DEVELOPER
  ) {
    items.splice(
      3,
      0,
      getItem(t("nav:credits"), "credits", <AppstoreOutlined />, [
        getItem(t("nav:creditBalance"), "credits/balance", <Icon.Wallet2 />),
        getItem(t("nav:transfers"), "credits/transfers", <SwapOutlined />),
        getItem(
          t("nav:retirements"),
          "credits/retirements",
          <Icon.ClockHistory />
        ),
      ])
    );
  }

  useEffect(() => {
    setSelectKey(currentPage);
  }, [currentPage]);

  // if (
  //   userInfoState?.userRole === Role.Root ||
  //   (userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
  //     userInfoState?.userRole === Role.Admin)
  // ) {
  //   items.splice(
  //     1,
  //     0,
  //     getItem(t('nav:nationalAccounting'), 'nationalAccounting', <Icon.GraphUpArrow />)
  //   );
  // }

  // if (userInfoState?.companyRole !== CompanyRole.PROGRAMME_DEVELOPER) {
  //   items.splice(
  //     4,
  //     0,
  //     getItem(t('nav:programmes'), 'programmeManagement/viewAll', <AppstoreOutlined />),
  //     getItem(t('nav:cdmTransitionProjects'), 'cdmManagement/viewAll', <UnorderedListOutlined />),
  //     getItem(t('nav:verra'), 'verraManagement/viewAll', <AppstoreOutlined />),
  //     getItem(t('nav:goldStandards'), 'goldStandardManagement/viewAll', <AppstoreOutlined />)
  //   );
  // }

  // if (userInfoState?.userRole === Role.Root) {
  //   items.push(getItem(t('nav:settings'), 'settings', <SettingOutlined />));
  // }

  const onClick: MenuProps["onClick"] = (e: { key: string }) => {
    navigate("/" + e.key);
  };
  return (
    <Sider
      width={240}
      className="layout-sider-container"
      breakpoint={collapsed ? undefined : "lg"}
      collapsed={collapsed}
    >
      <div className="layout-sider-div-container">
        <div
          className="layout-sider-heading-container"
          onClick={() => navigate(ROUTES.DASHBOARD, { replace: true })}
        >
          <div className="logo">
            <img src={sliderLogo} alt="slider-logo" />
          </div>
          {!collapsed && (
            <div>
              <div>
                <div className="title">{collapsed ? "" : "CARBON MARKET"}</div>
                <div className="title-sub">
                  {collapsed ? "" : "DIGITAL PLATFORM"}
                </div>
              </div>
              <div className="country-name">
                {import.meta.env.VITE_APP_COUNTRY_NAME || "CountryX"}
              </div>
            </div>
          )}
          {collapsed && (
            <div className="country-flag">
              <img
                alt="country flag"
                src={
                  import.meta.env.VITE_APP_COUNTRY_FLAG_URL ||
                  "https://carbon-common-dev.s3.amazonaws.com/flag.png"
                }
              />
            </div>
          )}
        </div>
        <div className="layout-sider-menu-container">
          <Menu
            theme="light"
            selectedKeys={[
              selectedKey
                ? selectedKey
                : !selectedKey && selectKey
                ? selectKey
                : "dashboard",
            ]}
            mode="inline"
            onClick={onClick}
          >
            {items.map((item) =>
              item?.children ? (
                <Menu.SubMenu
                  key={item.key}
                  icon={item.icon}
                  title={item.label}
                >
                  {item.children.map((child) => (
                    <Menu.Item key={child?.key} icon={child?.icon}>
                      <Link to={`/${child?.key}`}>{child?.label}</Link>
                    </Menu.Item>
                  ))}
                </Menu.SubMenu>
              ) : (
                <Menu.Item
                  key={item?.key}
                  icon={item?.icon}
                  className={
                    item?.key === "ndcManagement/viewAll" ||
                    item?.key === "investmentManagement/viewAll" ||
                    item?.key === "retirementManagement/viewAll" ||
                    item?.key === "programmeManagement/viewAll" ||
                    item?.key === "creditTransfers/viewAll"
                      ? "custom-padding-left"
                      : item?.key === "cdmManagement/viewAll"
                      ? "custom-padding-left wrap-content-overflow"
                      : ""
                  }
                  disabled={
                    // item?.key === 'programmeManagement/viewAll' ||
                    item?.key === "cdmManagement/viewAll" ||
                    item?.key === "goldStandardManagement/viewAll" ||
                    item?.key === "verraManagement/viewAll"
                  }
                >
                  <Link to={`/${item?.key}`}>{item?.label}</Link>
                </Menu.Item>
              )
            )}
          </Menu>
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

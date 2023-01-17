import { Col, MenuProps, Row } from 'antd';
import { useState } from 'react';
import './layout.header.scss';
import { useTranslation } from 'react-i18next';
import { HeaderProps } from '../../Definitions/InterfacesAndType/layout.header';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const LayoutHeader = (props: HeaderProps) => {
  const navigate = useNavigate();
  const { title, onToggle } = props;
  const { updateToken } = useConnection();
  const { removeUserInfo } = useUserContext();
  const { i18n } = useTranslation(['common', 'login']);
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  const [collapsed, setCollapsed] = useState(false);
  const companyLogo = localStorage.getItem('companyLogo');

  const signOut = (): void => {
    updateToken();
    removeUserInfo();
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <a onClick={() => signOut()}>Sign Out</a>,
    },
  ];

  return (
    <div className="header-container">
      <Row>
        {/* <Col span={1}>
          <div
            className="toggle-btn"
            onClick={() => {
              onToggle(!collapsed);
              setCollapsed(!collapsed);
            }}
          >
            {collapsed ? <RightOutlined /> : <LeftOutlined />}
          </div>
        </Col> */}
        <Col className="header-prof">
          <Row>
            <Col>
              <div className="header-country-logo">
                <img
                  src={'data:image/jpeg;base64,' + companyLogo}
                  alt="logo"
                  onClick={() => {
                    navigate('/userProfile/view');
                  }}
                />
              </div>
              {/* <div className="header-menu-container">
                <div className="header-signOut-container">
                  <Dropdown menu={{ items }} placement="bottomLeft">
                    <PersonCircle size={25} />
                  </Dropdown>
                </div>
              </div> */}
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default LayoutHeader;

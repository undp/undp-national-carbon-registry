import { MenuProps } from 'antd';
import { useState } from 'react';
import './layout.header.scss';
import { useTranslation } from 'react-i18next';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { useNavigate } from 'react-router-dom';
import thumbnail from '../../Assets/Images/thumbnail.png';
import { HeaderProps } from '@undp/carbon-library';

const LayoutHeader = (props: HeaderProps) => {
  const navigate = useNavigate();
  const { title, onToggle } = props;
  const { updateToken } = useConnection();
  const { removeUserInfo, userInfoState } = useUserContext();
  const { i18n } = useTranslation(['common', 'login']);
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  const [collapsed, setCollapsed] = useState(false);
  const companyLogo = userInfoState?.companyLogo;

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
      <div className="header-prof">
        <div className="header-country-logo">
          <img
            src={companyLogo as string}
            alt="logo"
            onClick={() => {
              navigate('/userProfile/view');
            }}
          />
        </div>
        <img src={thumbnail} alt="thumbnail" style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default LayoutHeader;

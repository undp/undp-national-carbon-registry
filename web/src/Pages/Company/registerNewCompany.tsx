import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AddNewCompanyComponent } from '@undp/carbon-library';
import './registerNewCompany.scss';
import { Row, Col, Button } from 'antd';
import sliderLogo from '../../Assets/Images/logo-slider.png';

const RegisterNewCompany = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['addCompany']);

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const onNavigateToHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="register-company-container">
      <Row>
        <Col md={18} lg={21} xs={17} flex="auto">
          <div className="homepage-header-container">
            <div className="homepage-header-container-logo" onClick={() => navigate('/')}>
              <div className="logo">
                <img src={sliderLogo} alt="slider-logo" />
              </div>
              <div>
                <div style={{ display: 'flex' }}>
                  <div className="title">{'CARBON'}</div>
                  <div className="title-sub">{'REGISTRY'}</div>
                </div>
                <div className="country-name">
                  {process.env.REACT_APP_COUNTRY_NAME || 'CountryX'}
                </div>
              </div>
            </div>
          </div>
        </Col>
        <Col md={6} lg={3} xs={7} flex="auto">
          <div className="homepage-button-container">
            <div className="button">
              <Button type="primary" onClick={() => navigate('/login')}>
                SIGN IN
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      <AddNewCompanyComponent
        t={t}
        maximumImageSize={maximumImageSize}
        useLocation={useLocation}
        regionField
        isGuest={true}
        onNavigateToHome={onNavigateToHome}
      ></AddNewCompanyComponent>
    </div>
  );
};

export default RegisterNewCompany;

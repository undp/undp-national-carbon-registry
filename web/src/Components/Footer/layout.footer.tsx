import { Col, Divider, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import './layout.footer.scss';
import { CcCircle } from 'react-bootstrap-icons';

const LayoutFooter = () => {
  const { i18n, t } = useTranslation(['common', 'homepage']);

  return (
    <div className="homepage-footer-container">
      <Row>
        <Col md={24} lg={24}>
          <div className="logocontainer">
            <div className="logo">
              <img src={sliderLogo} alt="slider-logo" />
            </div>
            <div>
              <div style={{ display: 'flex' }}>
                <div className="title">{'CARBON'}</div>
                <div className="title-sub">{'REGISTRY'}</div>
              </div>
              <div className="footer-country-name">
                {process.env.REACT_APP_COUNTRY_NAME || 'CountryX'}
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Divider className="divider" style={{ backgroundColor: '#FFFF' }} />
      <Row>
        <Col md={24} lg={24}>
          <div className="footertext">{t('homepage:footertext1')}</div>
        </Col>
      </Row>
      <Row>
        <Col md={10} lg={10}>
          <div className="footertext-bottom">
            {process.env.REACT_APP_COUNTRY_NAME || 'CountryX'}
            <CcCircle className="cc" color="#FFFF" size="10px" />
          </div>
        </Col>
        <Col md={14} lg={14}>
          <div className="footertext-link-container">
            <div>
              <a
                href="https://nationalcarbonregistrydemo.tawk.help/"
                target={'blank'}
                className="footertext-links"
              >
                {t('homepage:Help')}
              </a>
              <a href="https://status.carbreg.org/" target={'blank'} className="footertext-links">
                {t('homepage:Status')}
              </a>
              <a href="/cookie" className="footertext-links">
                {t('homepage:Cookie')}
              </a>
            </div>
            <div>
              <a href="codeconduct" className="footertext-links">
                {t('homepage:codeconduct')}
              </a>
              <a href="/terms#termuse" className="footertext-links">
                {t('homepage:terms')}
              </a>
              <a href="/privacy" className="footertext-links">
                {t('homepage:privacy')}
              </a>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LayoutFooter;

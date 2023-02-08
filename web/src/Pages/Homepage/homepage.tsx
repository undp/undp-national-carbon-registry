import { Button, Col, Divider, Form, Input, message, Row, Select, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import undpLogo from '../../Assets/Images/undp.png';
import forest from '../../Assets/Images/forest.png';
import resources from '../../Assets/Images/resources.png';
import './homepage.scss';
import { BarChart, Gem, Calculator, CcCircle } from 'react-bootstrap-icons';
const Homepage = () => {
  const { i18n, t } = useTranslation(['common', 'homepage']);
  const navigate = useNavigate();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    if (localStorage.getItem('i18nextLng')!.length > 2) {
      i18next.changeLanguage('en');
    }
  }, []);
  return (
    <div className="homepage-container">
      <Row>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-img-container">
            <Row>
              <Col md={21} lg={21} flex="auto">
                <div className="homepage-header-container">
                  <div className="logo">
                    <img src={sliderLogo} alt="slider-logo" />
                  </div>
                  <div>
                    <div style={{ display: 'flex' }}>
                      <div className="title">{'CARBON'}</div>
                      <div className="title-sub">{'REGISTRY'}</div>
                    </div>
                    <div className="country-name">
                      {process.env.COUNTRY_NAME || 'Antarctic Region'}
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={3} lg={3} flex="auto">
                <div className="homepage-button-container">
                  <div className="button">
                    <Button type="primary" onClick={() => navigate('/login')}>
                      SIGN IN
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <div className="text-ctn">
                <span>
                  {t('homepage:carbon')} {t('homepage:credit')} <br />
                  {t('homepage:registry')}
                </span>
                <div className="subhome">{t('homepage:lorem')}</div>
              </div>
            </Row>
          </div>
        </Col>
      </Row>
      <Row gutter={[8, 8]}>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-content-containerwhite">
            <div className="title">{t('homepage:aboutustitle')}</div>
            <div className="homepagebody">
              <div className="homepagebody_aboutusline1">{t('homepage:aboutusline1')}</div>
              <div className="homepagebody_subtitle">{t('homepage:Keyfeatures')}</div>

              <div className="aboutus_cards-container">
                <Row gutter={[5, 5]} className="aboutus_card-row">
                  <Col xxl={8} xl={8} md={8} className="aboutus_card-col">
                    <div className="aboutus-card-main-container">
                      <Col>
                        <Row className="aboutus_card-row">
                          <div>
                            <BarChart color="#FFFF" size="80px" />
                          </div>
                        </Row>
                        <Row className="aboutus_card-row">
                          <div className="aboutus-card-title">{t('homepage:analytic')}</div>
                        </Row>
                        <Row>
                          <div className="aboutus-card-text">{t('homepage:analyticbody')}</div>
                        </Row>
                      </Col>
                    </div>
                  </Col>
                  <Col xxl={8} xl={8} md={8} className="aboutus_card-col">
                    <div className="aboutus-card-main-container">
                      <Col>
                        <Row className="aboutus_card-row">
                          <div>
                            <Gem color="#FFFF" size="80px" />
                          </div>
                        </Row>
                        <Row className="aboutus_card-row">
                          <div className="aboutus-card-title">{t('homepage:carboncal')}</div>
                        </Row>
                        <Row>
                          <div className="aboutus-card-text">{t('homepage:carboncalbody')}</div>
                        </Row>
                      </Col>
                    </div>
                  </Col>
                  <Col xxl={8} xl={8} md={8} className="aboutus_card-col">
                    <div className="aboutus-card-main-container">
                      <Col>
                        <Row className="aboutus_card-row">
                          <div>
                            <Calculator className="aboutusicon" color="#FFFF" size="80px" />
                          </div>
                        </Row>
                        <Row className="aboutus_card-row">
                          <div className="aboutus-card-title">{t('homepage:serialgen')}</div>
                        </Row>
                        <Row>
                          <div className="aboutus-card-text">{t('homepage:serialgenbody')}</div>
                        </Row>
                      </Col>
                    </div>
                  </Col>
                </Row>
              </div>
              <Row>{t('homepage:aboutusline2')}</Row>
              <Row className="homepagebody_aboutuslines">{t('homepage:aboutusline3')}</Row>
              <div className="homepagebody_aboutusline1">Developed in Partnership with</div>
              <Row gutter={[8, 8]} className="undplogocontainer">
                <img className="undplogocontainer" src={undpLogo} alt="undp logo" />
              </Row>
            </div>
          </div>
        </Col>
      </Row>
      <Row gutter={[8, 8]}>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-image-content-container">
            <Row>
              <Col className="eligicontent" flex={2} md={12} lg={12}>
                <div className="title">{t('homepage:eligibility')}</div>
                <div className="homepagebody">
                  {t('homepage:eligibilitybody')}
                  <ul>
                    <li>{t('homepage:eliglist1')}</li>
                    <li>{t('homepage:eliglist2')}</li>
                    <li>{t('homepage:eliglist3')}</li>
                    <li>{t('homepage:eliglist4')}</li>
                  </ul>
                </div>
              </Col>
              <Col flex={3} md={12} lg={12}>
                <img className="image" src={forest} alt="forest" />
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
      <Row gutter={[8, 8]}>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-resources-content-container">
            <Row>
              <Col className="resource-image-container" md={12} lg={12}>
                <img className="image" src={resources} alt="resources" />
              </Col>
              <Col md={12} lg={12}>
                <div className="title">{t('homepage:resource')}</div>
                <div className="homepagebody">
                  <ul>
                    <li>{t('homepage:reslist1')}</li>
                    <li>{t('homepage:reslist2')}</li>
                    <li>{t('homepage:reslist3')}</li>
                  </ul>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
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
                  {process.env.COUNTRY_NAME || 'Antarctic Region'}
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
          <Col md={4.8} lg={12}>
            <div className="footertext-bottom">
              {process.env.COUNTRY_NAME || 'Antarctic Region'}
              <CcCircle className="cc" color="#FFFF" size="10px" />
            </div>
          </Col>
          <Col className="footertext-link-container" md={4.8} lg={12}>
            <a href="/cookie" className="footertext-links">
              {t('homepage:Cookie')}
            </a>
            <a href="codeconduct" className="footertext-links">
              {t('homepage:codeconduct')}
            </a>
            <a href="/terms#termuse" className="footertext-links">
              {t('homepage:terms')}
            </a>
            <a href="/privacy" className="footertext-links">
              {t('homepage:privacy')}
            </a>
          </Col>
        </Row>
      </div>

      {/* <Row>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-content-containerwhite">
            <div className="title">Contact Us</div>
            <div className="homepagebody">{t('homepage:name')}</div>
          </div>
        </Col>
      </Row> */}
    </div>
  );
};

export default Homepage;

import { Button, Col, Form, Input, message, Row, Select, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import undpLogo from '../../Assets/Images/undp.png';
import './homepage.scss';
import { BarChart, Gem, Calculator } from 'react-bootstrap-icons';
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
        <Col md={22} lg={22} flex="auto">
          <div className="homepage-header-container">
            <div className="logo">
              <img src={sliderLogo} alt="slider-logo" />
            </div>
            <div className="title">{'CARBON'}</div>
            <div className="title-sub">{'REGISTRY'}</div>
          </div>
        </Col>
        <Col md={2} lg={2} flex="auto">
          <div className="homepage-header-container">
            <div className="button">
              <Button type="primary" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-img-container">
            <div className="text-ctn">
              <span>
                {t('homepage:carbon')} {t('homepage:credit')} <br />
                {t('homepage:registry')}
              </span>
              <div className="subhome">{t('homepage:lorem')}</div>
            </div>
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
                <Row gutter={[8, 8]} className="aboutus_card-row">
                  <Col xxl={8} xl={12} md={12} className="aboutus_card-col">
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
                  <Col xxl={8} xl={12} md={12} className="aboutus_card-col">
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
                  <Col xxl={8} xl={12} md={12} className="aboutus_card-col">
                    <div className="aboutus-card-main-container">
                      <Col>
                        <Row className="aboutus_card-row">
                          <div>
                            <Calculator color="#FFFF" size="80px" />
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
          <div className="homepage-content-containerwhite">
            <div className="title">Resources</div>
            <div className="homepagebody">{t('homepage:resourcesbody')}</div>
          </div>
        </Col>
      </Row>

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

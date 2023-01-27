import { Button, Col, Form, Input, message, Row, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import './homepage.scss';
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
            <div className="title">About Us</div>
            <div className="homepagebody">{t('homepage:aboutusbody')}</div>
          </div>
        </Col>
      </Row>
      <Row gutter={[8, 8]}>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-content-containerblack">
            <div className="title">Eligibility</div>
            <div className="homepagebody">{t('homepage:eligibilitybody')}</div>
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

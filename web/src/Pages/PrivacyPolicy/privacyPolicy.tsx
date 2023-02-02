import { Button, Col, Divider, Form, Input, message, Row, Select, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import './privacyPolicy.scss';
const PrivacyPolicy = () => {
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
    <div className="privacy-container">
      <Row>
        <Col md={24} lg={24} flex="auto">
          <div onClick={() => navigate('/')} className="privacy-header-container">
            <div className="logo">
              <img src={sliderLogo} alt="slider-logo" />
            </div>
            <div>
              <div style={{ display: 'flex' }}>
                <div className="title">{'CARBON'}</div>
                <div className="title-sub">{'REGISTRY'}</div>
              </div>
              <div className="country-name">{process.env.COUNTRY_NAME || 'Antarctic Region'}</div>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="privacytitle">This is Privacy Policy Page</div>
        </Col>
      </Row>
    </div>
  );
};

export default PrivacyPolicy;

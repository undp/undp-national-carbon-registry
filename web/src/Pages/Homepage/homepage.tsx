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
            <span>
              {t('homepage:carbon')} {t('homepage:credit')} <br />
              {t('homepage:management')}
            </span>
          </div>
        </Col>
      </Row>
      <Row>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-content-containerwhite">
            <div className="title">Eligibility</div>
            <div className="homepagebody">
              Do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat. duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
              in culpa qui officia deserunt mollit anim id est laborum. Do eiusmod tempor incididunt
              ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation
              ullamco laboris nisi ut aliquip ex ea commodo consequat. duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum. Do eiusmod tempor incididunt ut labore et dolore magna
              aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
              aliquip ex ea commodo consequat. duis aute irure dolor in reprehenderit in voluptate
              velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
              non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-content-containerblack">
            <div className="title">Resources</div>
            <div className="homepagebody">
              Do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat. duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
              in culpa qui officia deserunt mollit anim id est laborum. Do eiusmod tempor incididunt
              ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation
              ullamco laboris nisi ut aliquip ex ea commodo consequat. duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum. Do eiusmod tempor incididunt ut labore et dolore magna
              aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
              aliquip ex ea commodo consequat. duis aute irure dolor in reprehenderit in voluptate
              velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
              non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-content-containerwhite">
            <div className="title">About Us</div>
            <div className="homepagebody">
              Do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat. duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
              in culpa qui officia deserunt mollit anim id est laborum. Do eiusmod tempor incididunt
              ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation
              ullamco laboris nisi ut aliquip ex ea commodo consequat. duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum. Do eiusmod tempor incididunt ut labore et dolore magna
              aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
              aliquip ex ea commodo consequat. duis aute irure dolor in reprehenderit in voluptate
              velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
              non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};
export default Homepage;

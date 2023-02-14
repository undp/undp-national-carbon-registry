import { Button, Col, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import undpLogo from '../../Assets/Images/undp.png';
import forest from '../../Assets/Images/forest.png';
import resources from '../../Assets/Images/resources.png';
import LayoutFooter from '../../Components/Footer/layout.footer';
import './homepage.scss';
import { BarChart, Gem, Calculator } from 'react-bootstrap-icons';
const Homepage = () => {
  const { i18n, t } = useTranslation(['common', 'homepage']);
  const navigate = useNavigate();
  const [Visible, setVisible] = useState(true);

  const controlDownArrow = () => {
    if (window.scrollY > 150) {
      setVisible(false);
    } else {
      setVisible(true);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleClickScroll = () => {
    const element = document.getElementById('scrollhome');
    if (element) {
      // 👇 Will scroll smoothly to the top of the next section
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (localStorage.getItem('i18nextLng')!.length > 2) {
      i18next.changeLanguage('en');
    }
    window.addEventListener('scroll', controlDownArrow);
    return () => {
      window.removeEventListener('scroll', controlDownArrow);
    };
  }, []);
  return (
    <div className="homepage-container">
      <Row>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-img-container image-container">
            <div className="background-image">
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
              <Row>
                {Visible && (
                  <nav className={'arrows'}>
                    <svg onClick={handleClickScroll}>
                      <path className="a1" d="M0 0 L30 32 L60 0"></path>
                      <path className="a2" d="M0 20 L30 52 L60 20"></path>
                      <path className="a3" d="M0 40 L30 72 L60 40"></path>
                    </svg>
                  </nav>
                )}
              </Row>
            </div>
          </div>
        </Col>
      </Row>
      <Row gutter={[8, 8]}>
        <Col md={24} lg={24} flex="auto">
          <div className="homepage-content-containerwhite">
            <div id="scrollhome" className="title">
              {t('homepage:aboutustitle')}
            </div>
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
      <LayoutFooter />

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

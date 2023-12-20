import { Button, Col, Divider, Form, Input, message, Row, Select, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import LayoutFooter from '../../Components/Footer/layout.footer';
import './codeofConduct.scss';
import { CcCircle } from 'react-bootstrap-icons';
const CodeOfConduct = () => {
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
    <div className="code-container">
      <Row>
        <Col span={24}>
          <div onClick={() => navigate('/')} className="code-header-container">
            <div className="logo">
              <img src={sliderLogo} alt="slider-logo" />
            </div>
            <div>
              <div style={{ display: 'flex' }}>
                <div className="title">{'CARBON'}</div>
                <div className="title-sub">{'REGISTRY'}</div>
              </div>
              <div className="country-name">{process.env.REACT_APP_COUNTRY_NAME || 'CountryX'}</div>
            </div>
          </div>
        </Col>
      </Row>
      <div className="code-body-container">
        <Row className="code-raw">
          <Col md={24} lg={24}>
            <div className="codetitle">CONTRIBUTOR COVENANT CODE OF CONDUCT</div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">Our Pledge</div>
            <div className="code-body">
              We as members, contributors, and leaders pledge to make participation in our community
              a harassment-free experience for everyone, regardless of age, body size, visible or
              invisible disability, ethnicity, sex characteristics, gender identity and expression,
              level of experience, education, socio-economic status, nationality, personal
              appearance, race, religion, or sexual identity and orientation.
              <br />
              We pledge to act and interact in ways that contribute to an open, welcoming, diverse,
              inclusive, and healthy community.
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">Our Standards</div>
            <div className="code-body">
              <p>
                Examples of behavior that contributes to a positive environment for our community
                include:
              </p>
              <ul>
                <li>Demonstrating empathy and kindness toward other people</li>
                <li>Being respectful of differing opinions, viewpoints, and experiences</li>
                <li>Giving and gracefully accepting constructive feedback</li>
                <li>
                  Accepting responsibility and apologizing to those affected by our mistakes, and
                  learning from the experience
                </li>
                <li>
                  Focusing on what is best not just for us as individuals, but for the overall
                  community
                </li>
              </ul>
              <p>Examples of unacceptable behavior include:</p>
              <ul>
                <li>
                  The use of sexualized language or imagery, and sexual attention or advances of any
                  kind
                </li>
                <li>
                  Trolling, insulting or derogatory comments, and personal or political attacks
                </li>
                <li>Public or private harassment</li>
                <li>
                  Publishing others&rsquo; private information, such as a physical or email address,
                  without their explicit permission
                </li>
                <li>
                  Other conduct which could reasonably be considered inappropriate in a professional
                  setting
                </li>
              </ul>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">Enforcement Responsibilities</div>
            <div className="code-body">
              <p>
                Community leaders are responsible for clarifying and enforcing our standards of
                acceptable behavior and will take appropriate and fair corrective action in response
                to any behavior that they deem inappropriate, threatening, offensive, or harmful.
              </p>
              <p>
                Community leaders have the right and responsibility to remove, edit, or reject
                comments, commits, code, wiki edits, issues, and other contributions that are not
                aligned to this Code of Conduct, and will communicate reasons for moderation
                decisions when appropriate.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">Scope</div>
            <div className="code-body">
              <p>
                This Code of Conduct applies within all community spaces, and also applies when an
                individual is officially representing the community in public spaces. Examples of
                representing our community include using an official e-mail address, posting via an
                official social media account, or acting as an appointed representative at an online
                or offline event.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">Enforcement</div>
            <div className="code-body">
              <p>
                Instances of abusive, harassing, or otherwise unacceptable behavior may be reported
                to the community leaders responsible for enforcement at [INSERT CONTACT METHOD]. All
                complaints will be reviewed and investigated promptly and fairly.
              </p>
              <p>
                All community leaders are obligated to respect the privacy and security of the
                reporter of any incident.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">Enforcement Guidelines</div>
            <div className="code-body">
              <p>
                Community leaders will follow these Community Impact Guidelines in determining the
                consequences for any action they deem in violation of this Code of Conduct:
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">1. Correction</div>
            <div className="code-body">
              <p>
                Community Impact: Use of inappropriate language or other behavior deemed
                unprofessional or unwelcome in the community.
              </p>
              <p>
                Consequence: A private, written warning from community leaders, providing clarity
                around the nature of the violation and an explanation of why the behavior was
                inappropriate. A public apology may be requested.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">2. Warning</div>
            <div className="code-body">
              <p> Community Impact: A violation through a single incident or series of actions.</p>
              <p>
                {' '}
                Consequence: A warning with consequences for continued behavior. No interaction with
                the people involved, including unsolicited interaction with those enforcing the Code
                of Conduct, for a specified period of time. This includes avoiding interactions in
                community spaces as well as external channels like social media. Violating these
                terms may lead to a temporary or permanent ban.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">3. Temporary Ban</div>
            <div className="code-body">
              <p>
                Community Impact: A serious violation of community standards, including sustained
                inappropriate behavior.
              </p>
              <p>
                Consequence: A temporary ban from any sort of interaction or public communication
                with the community for a specified period of time. No public or private interaction
                with the people involved, including unsolicited interaction with those enforcing the
                Code of Conduct, is allowed during this period. Violating these terms may lead to a
                permanent ban.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">4. Permanent Ban</div>
            <div className="code-body">
              <p>
                Community Impact: Demonstrating a pattern of violation of community standards,
                including sustained inappropriate behavior, harassment of an individual, or
                aggression toward or disparagement of classes of individuals.
              </p>
              <p>
                Consequence: A permanent ban from any sort of public interaction within the
                community.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="code-subtitle">Attribution</div>
            <div className="code-body">
              <p>
                This Code of Conduct is adapted from the
                <a href="https://www.contributor-covenant.org"> Contributor Covenant</a>, version
                2.0, available at{' '}
                <a href="https://www.contributor-covenant.org/version/2/0/code_of_conduct.html">
                  https://www.contributor-covenant.org/version/2/0/code_of_conduct.html
                </a>
                .
              </p>
              <p>
                Community Impact Guidelines were inspired by
                <a href="https://github.com/mozilla/diversity">
                  {' '}
                  Mozilla's code of conduct enforcement ladder
                </a>
                .
              </p>
              <p>
                For answers to common questions about this code of conduct, see the FAQ at{' '}
                <a href="https://www.contributor-covenant.org/faq">
                  https://www.contributor-covenant.org/faq
                </a>
                . Translations are available at{' '}
                <a href="https://www.contributor-covenant.org/translations">
                  https://www.contributor-covenant.org/translations
                </a>
                .
              </p>
            </div>
          </Col>
        </Row>
      </div>
      <div className="homepage-footer-container">
        {/* <Row>
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
        <Row className="footer-raw">
          <Col md={4.8} lg={12}>
            <div className="footertext-bottom">
              {process.env.REACT_APP_COUNTRY_NAME || 'CountryX'}
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
        </Row> */}
        <LayoutFooter />
      </div>
    </div>
  );
};

export default CodeOfConduct;

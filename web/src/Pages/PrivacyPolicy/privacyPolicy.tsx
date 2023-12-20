import { Button, Col, Divider, Form, Input, message, Row, Select, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import './privacyPolicy.scss';
import { CcCircle } from 'react-bootstrap-icons';
import LayoutFooter from '../../Components/Footer/layout.footer';
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
    <div id="policy" className="privacy-container">
      <Row>
        <Col span={24}>
          <div onClick={() => navigate('/')} className="privacy-header-container">
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
      <div className="privacy-body-container">
        <Row justify="center">
          <Col span={20}>
            <div className="privacytitle">SAMPLE PRIVACY NOTICE</div>
            <div className="privacy-sub">Last updated February 02, 2023</div>
            <div className="privacy-body">
              This privacy notice for CountryX (<b>"Company"</b>, <b>"we"</b>, <b>"us"</b>, and{' '}
              <b>"our"</b>) describes how and why we might collect, store, use, and/or share ("
              <b>process</b>")your information when you use our services ("<b>Services</b>"), such
              as when you:
              <ul>
                <li>
                  Visit our website at https://carbreg.org, or any website of ours that links to
                  this privacy notice
                </li>
                <li>
                  Engage with us in other related ways ― including any sales, marketing, or events
                </li>
              </ul>
              <p>
                <b>Questions or concerns?</b> Reading this privacy notice will help you understand
                your privacy rights and choices. If you do not agree with our policies and
                practices, please do not use our Services. If you still have any questions or
                concerns, please contact us at address@CountryX.org.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div className="privacy-subtitle-summary">SUMMARY OF KEY POINTS</div>
            <div className="privacy-body">
              <p>
                <b>
                  This summary provides key points from our privacy notice, but you can find out
                  more details about any of these topics by clicking the link following each key
                  point or by using our table of contents below to find the section you are looking
                  for. You can also click<a href="#toc"> here</a> to go directly to our table of
                  contents.
                </b>
              </p>
              <p>
                <b>What personal information do we process? </b>When you visit, use, or navigate our
                Services, we may process personal information depending on how you interact with
                CountryX and the Services, the choices you make, and the products and features you
                use. Click<a href="#infocollect"> here</a> to learn more.
              </p>
              <p>
                <b>Do we process any sensitive personal information?</b> We do not process sensitive
                personal information.
              </p>
              <p>
                <b>Do you receive any information from third parties?</b> We do not receive any
                information from third parties.
                <br />
              </p>
              <p>
                <b>How do you process my information?</b> We process your information to provide,
                improve, and administer our Services, communicate with you, for security and fraud
                prevention, and to comply with law. We may also process your information for other
                purposes with your consent. We process your information only when we have a valid
                legal reason to do so. Click<a href="#infouse"> here</a> to learn more.
              </p>
              <p>
                <b>In what situations and with which parties do we share personal information?</b>{' '}
                We may share information in specific situations and with specific third parties.
                Click
                <a href="#whoshare"> here</a> to learn more.
              </p>
              <p>
                <b>How do we keep your information safe?</b> We have organizational and technical
                processes and procedures in place to protect your personal information. However, no
                electronic transmission over the internet or information storage technology can be
                guaranteed to be 100% secure, so we cannot promise or guarantee that hackers,
                cybercriminals, or other unauthorized third parties will not be able to defeat our
                security and improperly collect, access, steal, or modify your information. Click
                <a href="#infosafe"> here</a> to learn more.
              </p>
              <p>
                <b>What are your rights?</b> Depending on where you are located geographically, the
                applicable privacy law may mean you have certain rights regarding your personal
                information. Click<a href="#privacyrights"> here</a> to learn more.
              </p>
              <p>
                <b>How do I exercise my rights? </b> The easiest way to exercise your rights is by
                filling out our data subject request form available
                <a href="https://app.termly.io/notify/d2782ea2-96ee-43e9-96de-b60955f40192">
                  {' '}
                  here
                </a>
                , or by contacting us. We will consider and act upon any request in accordance with
                applicable data protection laws.
              </p>
              <p>
                Want to learn more about what CountryX does with any information we collect? Click{' '}
                <a href="#toc"> here</a> to review the notice in full.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="toc" className="privacy-subtitle">
              TABLE OF CONTENTS
            </div>
            <div className="privacy-body">
              <ol>
                <li>
                  {' '}
                  <a href="#infocollect">WHAT INFORMATION DO WE COLLECT?</a>
                </li>
                <li>
                  {' '}
                  <a href="#infouse">HOW DO WE PROCESS YOUR INFORMATION?</a>
                </li>
                <li>
                  {' '}
                  <a href="#legalbases">
                    WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?
                  </a>
                </li>
                <li>
                  {' '}
                  <a href="#whoshare">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a>
                </li>
                <li>
                  {' '}
                  <a href="#cookies">DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a>
                </li>
                <li>
                  {' '}
                  <a href="#inforetain">HOW LONG DO WE KEEP YOUR INFORMATION?</a>
                </li>
                <li>
                  {' '}
                  <a href="#infosafe">HOW DO WE KEEP YOUR INFORMATION SAFE?</a>
                </li>
                <li>
                  {' '}
                  <a href="#infominors">DO WE COLLECT INFORMATION FROM MINORS?</a>
                </li>
                <li>
                  {' '}
                  <a href="#privacyrights">WHAT ARE YOUR PRIVACY RIGHTS?</a>
                </li>
                <li>
                  {' '}
                  <a href="#DNT">CONTROLS FOR DO-NOT-TRACK FEATURES</a>
                </li>
                <li>
                  {' '}
                  <a href="#caresidents">DO CALIFORNIA RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</a>
                </li>
                <li>
                  {' '}
                  <a href="#policyupdates">DO WE MAKE UPDATES TO THIS NOTICE?</a>
                </li>
                <li>
                  {' '}
                  <a href="#contact">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a>
                </li>
                <li>
                  {' '}
                  <a href="#request">
                    HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?
                  </a>
                </li>
              </ol>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="infocollect" className="privacy-subtitle">
              1. WHAT INFORMATION DO WE COLLECT?
            </div>
            <div className="privacy-body">
              <p>
                <b>Personal information you disclose to us.</b>
              </p>
              <p>
                <i>
                  <b>In Short:</b> We collect personal information that you provide to us
                </i>
              </p>
              <p>
                We collect personal information that you voluntarily provide to us when you register
                on the Services, express an interest in obtaining information about us or our
                products and Services, when you participate in activities on the Services, or
                otherwise when you contact us.
              </p>
              <p>
                <b>Personal Information Provided by You.</b> The personal information that we
                collect depends on the context of your interactions with us and the Services, the
                choices you make, and the products and features you use. The personal information we
                collect may include the following:
                <br />
              </p>
              <ul>
                <li>names</li>
                <li>phone numbers</li>
                <li>email addresses</li>
                <li>usernames</li>
                <li>passwords</li>
                <li>contact preferences</li>
              </ul>
              <p>
                <b>Sensitive Information.</b> We do not process sensitive information.
              </p>
              <p>
                All personal information that you provide to us must be true, complete, and
                accurate, and you must notify us of any changes to such personal information.
              </p>
              <p>
                <b>Information automatically collected</b>
              </p>
              <p>
                <i>
                  <b>In Short:</b> Some information — such as your Internet Protocol (IP) address
                  and/or browser and device characteristics — is collected automatically when you
                  visit our Services.
                </i>
              </p>
              <p>
                We automatically collect certain information when you visit, use, or navigate the
                Services. This information does not reveal your specific identity (like your name or
                contact information) but may include device and usage information, such as your IP
                address, browser and device characteristics, operating system, language preferences,
                referring URLs, device name, country, location, information about how and when you
                use our Services, and other technical information. This information is primarily
                needed to maintain the security and operation of our Services, and for our internal
                analytics and reporting purposes.
              </p>
              <p>
                Like many businesses, we also collect information through cookies and similar
                technologies.
              </p>
              <p>The information we collect includes:</p>
              <ul>
                <li>
                  <i>Log and Usage Data.</i> Log and usage data is service-related, diagnostic,
                  usage, and performance information our servers automatically collect when you
                  access or use our Services and which we record in log files. Depending on how you
                  interact with us, this log data may include your IP address, device information,
                  browser type, and settings and information about your activity in the Services
                  (such as the date/time stamps associated with your usage, pages and files viewed,
                  searches, and other actions you take such as which features you use), device event
                  information (such as system activity, error reports (sometimes called "crash
                  dumps"), and hardware settings).
                </li>
                <li>
                  <i>Device Data.</i> We collect device data such as information about your
                  computer, phone, tablet, or other device you use to access the Services. Depending
                  on the device used, this device data may include information such as your IP
                  address (or proxy server), device and application identification numbers,
                  location, browser type, hardware model, Internet service provider and/or mobile
                  carrier, operating system, and system configuration information.
                </li>
                <li>
                  <i>Location Data.</i> We collect location data such as information about your
                  device's location, which can be either precise or imprecise. How much information
                  we collect depends on the type and settings of the device you use to access the
                  Services. For example, we may use GPS and other technologies to collect
                  geolocation data that tells us your current location (based on your IP address).
                  You can opt out of allowing us to collect this information either by refusing
                  access to the information or by disabling your Location setting on your device.
                  However, if you choose to opt out, you may not be able to use certain aspects of
                  the Services.
                </li>
              </ul>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="infouse" className="privacy-subtitle">
              2. HOW DO WE PROCESS YOUR INFORMATION?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> We process your information to provide, improve, and administer
                  our Services, communicate with you, for security and fraud prevention, and to
                  comply with law. We may also process your information for other purposes with your
                  consent.
                </i>
              </p>
              <p>
                <b>
                  We process your personal information for a variety of reasons, depending on how
                  you interact with our Services, including:
                </b>
              </p>
              <ul>
                <li>
                  <b>
                    To facilitate account creation and authentication and otherwise manage user
                    accounts.
                  </b>{' '}
                  We may process your information so you can create and log in to your account, as
                  well as keep your account in working order.
                </li>
                <li>
                  <b>To request feedback.</b> We may process your information when necessary to
                  request feedback and to contact you about your use of our Services.
                </li>
                <li>
                  <b>To send you marketing and promotional communications.</b> We may process the
                  personal information you send to us for our marketing purposes, if this is in
                  accordance with your marketing preferences. You can opt out of our marketing
                  emails at any time. For more information, see "
                  <a href="#privacyrights">WHAT ARE YOUR PRIVACY RIGHTS?</a>" below.
                </li>
                <li>
                  <b>To deliver targeted advertising to you.</b> We may process your information to
                  develop and display personalized content and advertising tailored to your
                  interests, location, and more.
                </li>
                <li>
                  <b>To protect our Services.</b> We may process your information as part of our
                  efforts to keep our Services safe and secure, including fraud monitoring and
                  prevention.
                </li>
                <li>
                  <b>To identify usage trends.</b> We may process information about how you use our
                  Services to better understand how they are being used so we can improve them.
                </li>
                <li>
                  <b>To determine the effectiveness of our marketing and promotional campaigns.</b>{' '}
                  We may process your information to better understand how to provide marketing and
                  promotional campaigns that are most relevant to you.
                </li>
                <li>
                  <b>To save or protect an individual's vital interest.</b> We may process your
                  information when necessary to save or protect an individual’s vital interest, such
                  as to prevent harm.
                </li>
              </ul>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="legalbases" className="privacy-subtitle">
              3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short: </b>We only process your personal information when we believe it is
                  necessary and we have a valid legal reason (i.e., legal basis) to do so under
                  applicable law, like with your consent, to comply with laws, to provide you with
                  services to enter into or fulfill our contractual obligations, to protect your
                  rights, or to fulfill our legitimate business interests.
                </i>
              </p>
              <p>
                <i>
                  <u>
                    <b>If you are located in the EU or UK, this section applies to you.</b>
                  </u>
                </i>
              </p>
              <p>
                The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the
                valid legal bases we rely on in order to process your personal information. As such,
                we may rely on the following legal bases to process your personal information:
              </p>
              <ul>
                <li>
                  <b>Consent.</b> We may process your information if you have given us permission
                  (i.e., consent) to use your personal information for a specific purpose. You can
                  withdraw your consent at any time. Click<a href="#withdrawconsent"> here</a> to
                  learn more.
                </li>
                <li>
                  <b>Legitimate Interests.</b> We may process your information when we believe it is
                  reasonably necessary to achieve our legitimate business interests and those
                  interests do not outweigh your interests and fundamental rights and freedoms. For
                  example, we may process your personal information for some of the purposes
                  described in order to:
                </li>
                <ul>
                  <li>
                    Send users information about special offers and discounts on our products and
                    services
                  </li>
                  <li>
                    Develop and display personalized and relevant advertising content for our users
                  </li>
                  <li>
                    Analyze how our services are used so we can improve them to engage and retain
                    users
                  </li>
                  <li>Support our marketing activities</li>
                  <li>Diagnose problems and/or prevent fraudulent activities</li>
                  <li>
                    Understand how our users use our products and services so we can improve user
                    experience
                  </li>
                </ul>
                <li>
                  <b>Legal Obligations.</b> We may process your information where we believe it is
                  necessary for compliance with our legal obligations, such as to cooperate with a
                  law enforcement body or regulatory agency, exercise or defend our legal rights, or
                  disclose your information as evidence in litigation in which we are involved.
                </li>
                <li>
                  <b>Vital Interests.</b> We may process your information where we believe it is
                  necessary to protect your vital interests or the vital interests of a third party,
                  such as situations involving potential threats to the safety of any person.
                </li>
              </ul>
              <p>
                In legal terms, we are generally the “data controller” under European data
                protection laws of the personal information described in this privacy notice, since
                we determine the means and/or purposes of the data processing we perform. This
                privacy notice does not apply to the personal information we process as a “data
                processor” on behalf of our customers. In those situations, the customer that we
                provide services to and with whom we have entered into a data processing agreement
                is the “data controller” responsible for your personal information, and we merely
                process your information on their behalf in accordance with your instructions. If
                you want to know more about our customers' privacy practices, you should read their
                privacy policies and direct any questions you have to them.
              </p>
              <p>
                <i>
                  <u>
                    <b>If you are located in Canada, this section applies to you.</b>
                  </u>
                </i>
              </p>
              <p>
                We may process your information if you have given us specific permission (i.e.,
                express consent) to use your personal information for a specific purpose, or in
                situations where your permission can be inferred (i.e., implied consent). You can
                withdraw your consent at any time. Click <a href="#withdrawconsent">here</a> to
                learn more.
              </p>
              <p>
                In some exceptional cases, we may be legally permitted under applicable law to
                process your information without your consent, including, for example:
              </p>
              <ul>
                <li>
                  If collection is clearly in the interests of an individual and consent cannot be
                  obtained in a timely way
                </li>
                <li>For investigations and fraud detection and prevention</li>
                <li>For business transactions provided certain conditions are met</li>
                <li>
                  If it is contained in a witness statement and the collection is necessary to
                  assess, process, or settle an insurance claim
                </li>
                <li>
                  For identifying injured, ill, or deceased persons and communicating with next of
                  kin
                </li>
                <li>
                  If we have reasonable grounds to believe an individual has been, is, or may be
                  victim of financial abuse
                </li>
                <li>
                  If it is reasonable to expect collection and use with consent would compromise the
                  availability or the accuracy of the information and the collection is reasonable
                  for purposes related to investigating a breach of an agreement or a contravention
                  of the laws of Canada or a province
                </li>
                <li>
                  If disclosure is required to comply with a subpoena, warrant, court order, or
                  rules of the court relating to the production of records
                </li>
                <li>
                  If it was produced by an individual in the course of their employment, business,
                  or profession and the collection is consistent with the purposes for which the
                  information was produced
                </li>
                <li>
                  If the collection is solely for journalistic, artistic, or literary purposes
                </li>
                <li>
                  If the information is publicly available and is specified by the regulations
                </li>
              </ul>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="whoshare" className="privacy-subtitle">
              4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> We may share information in specific situations described in this
                  section and/or with the following third parties.
                </i>
              </p>
              <p>We may need to share your personal information in the following situations:</p>
              <ul>
                <li>
                  <b>Business Transfers.</b> We may share or transfer your information in connection
                  with, or during negotiations of, any merger, sale of company assets, financing, or
                  acquisition of all or a portion of our business to another company.
                </li>
              </ul>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="cookies" className="privacy-subtitle">
              5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> We may use cookies and other tracking technologies to collect and
                  store your information.
                </i>
              </p>
              <p>
                We may use cookies and similar tracking technologies (like web beacons and pixels)
                to access or store information. Specific information about how we use such
                technologies and how you can refuse certain cookies is set out in our Cookie Notice.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="inforetain" className="privacy-subtitle">
              6. HOW LONG DO WE KEEP YOUR INFORMATION?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> We keep your information for as long as necessary to fulfill the
                  purposes outlined in this privacy notice unless otherwise required by law.
                </i>
              </p>
              <p>
                We will only keep your personal information for as long as it is necessary for the
                purposes set out in this privacy notice, unless a longer retention period is
                required or permitted by law (such as tax, accounting, or other legal requirements).
                No purpose in this notice will require us keeping your personal information for
                longer than the period of time in which users have an account with us.
              </p>
              <p>
                When we have no ongoing legitimate business need to process your personal
                information, we will either delete or anonymize such information, or, if this is not
                possible (for example, because your personal information has been stored in backup
                archives), then we will securely store your personal information and isolate it from
                any further processing until deletion is possible.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="infosafe" className="privacy-subtitle">
              7. HOW DO WE KEEP YOUR INFORMATION SAFE?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> We aim to protect your personal information through a system of
                  organizational and technical security measures.
                </i>
              </p>
              <p>
                We have implemented appropriate and reasonable technical and organizational security
                measures designed to protect the security of any personal information we process.
                However, despite our safeguards and efforts to secure your information, no
                electronic transmission over the Internet or information storage technology can be
                guaranteed to be 100% secure, so we cannot promise or guarantee that hackers,
                cybercriminals, or other unauthorized third parties will not be able to defeat our
                security and improperly collect, access, steal, or modify your information. Although
                we will do our best to protect your personal information, transmission of personal
                information to and from our Services is at your own risk. You should only access the
                Services within a secure environment.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="infominors" className="privacy-subtitle">
              8. DO WE COLLECT INFORMATION FROM MINORS?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> We do not knowingly collect data from or market to children under
                  18 years of age.
                </i>
              </p>
              <p>
                We do not knowingly solicit data from or market to children under 18 years of age.
                By using the Services, you represent that you are at least 18 or that you are the
                parent or guardian of such a minor and consent to such minor dependent’s use of the
                Services. If we learn that personal information from users less than 18 years of age
                has been collected, we will deactivate the account and take reasonable measures to
                promptly delete such data from our records. If you become aware of any data we may
                have collected from children under age 18, please contact us at info@panos.org.zm.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="privacyrights" className="privacy-subtitle">
              9. WHAT ARE YOUR PRIVACY RIGHTS?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> In some regions, such as the European Economic Area (EEA), United
                  Kingdom (UK), and Canada, you have rights that allow you greater access to and
                  control over your personal information. You may review, change, or terminate your
                  account at any time.
                </i>
              </p>
              <p>
                In some regions (like the EEA, UK, and Canada), you have certain rights under
                applicable data protection laws. These may include the right (i) to request access
                and obtain a copy of your personal information, (ii) to request rectification or
                erasure; (iii) to restrict the processing of your personal information; and (iv) if
                applicable, to data portability. In certain circumstances, you may also have the
                right to object to the processing of your personal information. You can make such a
                request by contacting us by using the contact details provided in the section "
                <a href="#contact">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a>" below.
              </p>
              <p>
                We will consider and act upon any request in accordance with applicable data
                protection laws.
              </p>
              <p>
                If you are located in the EEA or UK and you believe we are unlawfully processing
                your personal information, you also have the right to complain to your local data
                protection supervisory authority. You can find their contact details here:
                <a href=" https://ec.europa.eu/newsroom/article29/items/612080">
                  {' '}
                  https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.html.
                </a>
              </p>
              <p>
                If you are located in Switzerland, the contact details for the data protection
                authorities are available here:
                <a href="https://www.edoeb.admin.ch/edoeb/en/home.html">
                  {' '}
                  https://www.edoeb.admin.ch/edoeb/en/home.html.
                </a>
              </p>

              <div id="withdrawconsent">
                <p>
                  <u>
                    <b>Withdrawing your consent:</b>
                  </u>{' '}
                  If we are relying on your consent to process your personal information, which may
                  be express and/or implied consent depending on the applicable law, you have the
                  right to withdraw your consent at any time. You can withdraw your consent at any
                  time by contacting us by using the contact details provided in the section "
                  <a href="#contact">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a>" below.
                </p>
              </div>

              <p>
                However, please note that this will not affect the lawfulness of the processing
                before its withdrawal, nor when applicable law allows, will it affect the processing
                of your personal information conducted in reliance on lawful processing grounds
                other than consent.
              </p>
              <p>
                <u>
                  <b>Opting out of marketing and promotional communications:</b>
                </u>{' '}
                You can unsubscribe from our marketing and promotional communications at any time by
                clicking on the unsubscribe link in the emails that we send, replying “STOP” or
                “UNSUBSCRIBE” to the SMS messages that we send, or by contacting us using the
                details provided in the section "
                <a href="#contact">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a>" below. You will
                then be removed from the marketing lists — however, we may still communicate with
                you, for example to send you service-related messages that are necessary for the
                administration and use of your account, to respond to service requests, or for other
                non-marketing purposes.
              </p>
              <p>
                <b>Account Information</b>
              </p>
              <p>
                If you would at any time like to review or change the information in your account or
                terminate your account, you can:
              </p>
              <ul>
                <li>Log in to your account settings and update your user account.</li>
              </ul>
              <p>
                Upon your request to terminate your account, we will deactivate or delete your
                account and information from our active databases. However, we may retain some
                information in our files to prevent fraud, troubleshoot problems, assist with any
                investigations, enforce our legal terms and/or comply with applicable legal
                requirements.
              </p>
              <p>
                <u>
                  <b>Cookies and similar technologies:</b>
                </u>{' '}
                Most Web browsers are set to accept cookies by default. If you prefer, you can
                usually choose to set your browser to remove cookies and to reject cookies. If you
                choose to remove cookies or reject cookies, this could affect certain features or
                services of our Services. To opt out of interest-based advertising by advertisers on
                our Services visit{' '}
                <a href="http://www.aboutads.info/choices/.">http://www.aboutads.info/choices/.</a>
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="DNT" className="privacy-subtitle">
              10. CONTROLS FOR DO-NOT-TRACK FEATURES
            </div>
            <div className="privacy-body">
              <p>
                Most web browsers and some mobile operating systems and mobile applications include
                a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy
                preference not to have data about your online browsing activities monitored and
                collected. At this stage no uniform technology standard for recognizing and
                implementing DNT signals has been finalized. As such, we do not currently respond to
                DNT browser signals or any other mechanism that automatically communicates your
                choice not to be tracked online. If a standard for online tracking is adopted that
                we must follow in the future, we will inform you about that practice in a revised
                version of this privacy notice.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="caresidents" className="privacy-subtitle">
              11. DO CALIFORNIA RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> Yes, if you are a resident of California, you are granted
                  specific rights regarding access to your personal information.
                </i>
              </p>
              <p>
                California Civil Code Section 1798.83, also known as the "Shine The Light" law,
                permits our users who are California residents to request and obtain from us, once a
                year and free of charge, information about categories of personal information (if
                any) we disclosed to third parties for direct marketing purposes and the names and
                addresses of all third parties with which we shared personal information in the
                immediately preceding calendar year. If you are a California resident and would like
                to make such a request, please submit your request in writing to us using the
                contact information provided below.
              </p>
              <p>
                If you are under 18 years of age, reside in California, and have a registered
                account with Services, you have the right to request removal of unwanted data that
                you publicly post on the Services. To request removal of such data, please contact
                us using the contact information provided below and include the email address
                associated with your account and a statement that you reside in California. We will
                make sure the data is not publicly displayed on the Services, but please be aware
                that the data may not be completely or comprehensively removed from all our systems
                (e.g., backups, etc.).
              </p>
              <p>
                <b>CCPA Privacy Notice</b>
              </p>
              <p>The California Code of Regulations defines a "resident" as:</p>
              <ol>
                <li>
                  every individual who is in the State of California for other than a temporary or
                  transitory purpose and
                </li>
                <li>
                  every individual who is domiciled in the State of California who is outside the
                  State of California for a temporary or transitory purpose
                </li>
              </ol>
              <p>All other individuals are defined as "non-residents."</p>
              <p>
                If this definition of "resident" applies to you, we must adhere to certain rights
                and obligations regarding your personal information.
              </p>
              <p>
                <b>What categories of personal information do we collect?</b>
              </p>
              <p>
                We have collected the following categories of personal information in the past
                twelve (12) months:
              </p>
              <table border={1}>
                <tr>
                  <th>Category</th>
                  <th>Examples</th>
                  <th>Collected</th>
                </tr>
                <tr>
                  <td className="table-row1">A. Identifiers</td>
                  <td className="table-row1">
                    Contact details, such as real name, alias, postal address, telephone or mobile
                    contact number, unique personal identifier, online identifier, Internet Protocol
                    address, email address, and account name
                  </td>
                  <td className="table-row3">YES</td>
                </tr>
                <tr>
                  <td className="table-row1">
                    B. Personal information categories listed in the California Customer Records
                    statute
                  </td>
                  <td className="table-row1">
                    Name, contact information, education, employment, employment history, and
                    financial information
                  </td>
                  <td className="table-row3">YES</td>
                </tr>
                <tr>
                  <td className="table-row1">
                    C. Protected classification characteristics under California or federal law
                  </td>
                  <td className="table-row1">Gender and date of birth</td>
                  <td className="table-row3">NO</td>
                </tr>
                <tr>
                  <td className="table-row1">D. Commercial information</td>
                  <td className="table-row1">
                    Transaction information, purchase history, financial details, and payment
                    information
                  </td>
                  <td className="table-row3">NO</td>
                </tr>
                <tr>
                  <td className="table-row1">E. Biometric information</td>
                  <td className="table-row1">Fingerprints and voiceprints</td>
                  <td className="table-row3">NO</td>
                </tr>
                <tr>
                  <td className="table-row1">F. Internet or other similar network activity</td>
                  <td className="table-row1">
                    Browsing history, search history, online behavior, interest data, and
                    interactions with our and other websites, applications, systems, and
                    advertisements
                  </td>
                  <td className="table-row3">YES</td>
                </tr>
                <tr>
                  <td className="table-row1">G. Geolocation data</td>
                  <td className="table-row1">Device location</td>
                  <td className="table-row3">YES</td>
                </tr>
                <tr>
                  <td className="table-row1">
                    H. Audio, electronic, visual, thermal, olfactory, or similar information
                  </td>
                  <td className="table-row1">
                    Images and audio, video or call recordings created in connection with our
                    business activities
                  </td>
                  <td className="table-row3">NO</td>
                </tr>
                <tr>
                  <td className="table-row1">I. Professional or employment-related information</td>
                  <td className="table-row1">
                    Business contact details in order to provide you our services at a business
                    level or job title, work history, and professional qualifications if you apply
                    for a job with us
                  </td>
                  <td className="table-row3">NO</td>
                </tr>
                <tr>
                  <td className="table-row1">J. Education Information</td>
                  <td className="table-row1">Student records and directory information</td>
                  <td className="table-row3">NO</td>
                </tr>
                <tr>
                  <td className="table-row1">
                    K. Inferences drawn from other personal information
                  </td>
                  <td className="table-row1">
                    Inferences drawn from any of the collected personal information listed above to
                    create a profile or summary about, for example, an individual’s preferences and
                    characteristics
                  </td>
                  <td className="table-row3">NO</td>
                </tr>
              </table>
              <p>
                We may also collect other personal information outside of these categories instances
                where you interact with us in person, online, or by phone or mail in the context of:
              </p>
              <ul>
                <li>Receiving help through our customer support channels;</li>
                <li>Participation in customer surveys or contests; and</li>
                <li>
                  Facilitation in the delivery of our Services and to respond to your inquiries.
                </li>
              </ul>
              <p>
                <b>How do we use and share your personal information?</b>
              </p>
              <p>
                <b>
                  More information about our data collection and sharing practices can be found in
                  this privacy notice.
                </b>
              </p>
              <p>
                You may contact us Social Media Profiles,
                <b>or by referring to the contact details at the bottom of this document.</b>
              </p>
              <p>
                If you are using an authorized agent to exercise your right to opt out we may deny a
                request if the authorized agent does not submit proof that they have been validly
                authorized to act on your behalf.
              </p>
              <p>
                <b>Will your information be shared with anyone else?</b>
              </p>
              <p>
                We may disclose your personal information with our service providers pursuant to a
                written contract between us and each service provider. Each service provider is a
                for-profit entity that processes the information on our behalf.
              </p>
              <p>
                We may use your personal information for our own business purposes, such as for
                undertaking internal research for technological development and demonstration. This
                is not considered to be "selling" of your personal information.
              </p>
              <p>
                CountryX has not disclosed or sold any personal information to third parties for a
                business or commercial purpose in the preceding twelve (12) months. CountryX will
                not sell personal information in the future belonging to website visitors, users,
                and other consumers.
              </p>
              <p>
                <b>Your rights with respect to your personal data</b>
              </p>
              <p>
                <u>Right to request deletion of the data — Request to delete</u>
              </p>
              <p>
                You can ask for the deletion of your personal information. If you ask us to delete
                your personal information, we will respect your request and delete your personal
                information, subject to certain exceptions provided by law, such as (but not limited
                to) the exercise by another consumer of his or her right to free speech, our
                compliance requirements resulting from a legal obligation, or any processing that
                may be required to protect against illegal activities.
              </p>
              <p>
                <u>Right to be informed — Request to know</u>
              </p>
              <p>Depending on the circumstances, you have a right to know:</p>
              <ul>
                <li>whether we collect and use your personal information;</li>
                <li>the categories of personal information that we collect;</li>
                <li>the purposes for which the collected personal information is used;</li>
                <li>whether we sell your personal information to third parties;</li>
                <li>
                  the categories of personal information that we sold or disclosed for a business
                  purpose;
                </li>
                <li>
                  the categories of third parties to whom the personal information was sold or
                  disclosed for a business purpose; and
                </li>
                <li>
                  the business or commercial purpose for collecting or selling personal information.
                </li>
              </ul>
              <p>
                In accordance with applicable law, we are not obligated to provide or delete
                consumer information that is de-identified in response to a consumer request or to
                re-identify individual data to verify a consumer request.
              </p>
              <p>
                <u>Right to Non-Discrimination for the Exercise of a Consumer’s Privacy Rights</u>
              </p>
              <p>We will not discriminate against you if you exercise your privacy rights.</p>
              <p>
                <u>Verification process</u>
              </p>
              <p>
                Upon receiving your request, we will need to verify your identity to determine you
                are the same person about whom we have the information in our system. These
                verification efforts require us to ask you to provide information so that we can
                match it with information you have previously provided us. For instance, depending
                on the type of request you submit, we may ask you to provide certain information so
                that we can match the information you provide with the information we already have
                on file, or we may contact you through a communication method (e.g., phone or email)
                that you have previously provided to us. We may also use other verification methods
                as the circumstances dictate.
              </p>
              <p>
                We will only use personal information provided in your request to verify your
                identity or authority to make the request. To the extent possible, we will avoid
                requesting additional information from you for the purposes of verification.
                However, if we cannot verify your identity from the information already maintained
                by us, we may request that you provide additional information for the purposes of
                verifying your identity and for security or fraud-prevention purposes. We will
                delete such additionally provided information as soon as we finish verifying you.
              </p>
              <p>
                <u>Other privacy rights</u>
              </p>
              <ul>
                <li>You may object to the processing of your personal information.</li>
                <li>
                  You may request correction of your personal data if it is incorrect or no longer
                  relevant, or ask to restrict the processing of the information.
                </li>
                <li>
                  You can designate an authorized agent to make a request under the CCPA on your
                  behalf. We may deny a request from an authorized agent that does not submit proof
                  that they have been validly authorized to act on your behalf in accordance with
                  the CCPA.
                </li>
                <li>
                  You may request to opt out from future selling of your personal information to
                  third parties. Upon receiving an opt-out request, we will act upon the request as
                  soon as feasibly possible, but no later than fifteen (15) days from the date of
                  the request submission.
                </li>
              </ul>
              <p>
                To exercise these rights, you can contact us Social Media Profiles, or by referring
                to the contact details at the bottom of this document. If you have a complaint about
                how we handle your data, we would like to hear from you.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="policyupdates" className="privacy-subtitle">
              12. DO WE MAKE UPDATES TO THIS NOTICE?
            </div>
            <div className="privacy-body">
              <p>
                <i>
                  <b>In Short:</b> Yes, we will update this notice as necessary to stay compliant
                  with relevant laws.
                </i>
              </p>
              <p>
                We may update this privacy notice from time to time. The updated version will be
                indicated by an updated "Revised" date and the updated version will be effective as
                soon as it is accessible. If we make material changes to this privacy notice, we may
                notify you either by prominently posting a notice of such changes or by directly
                sending you a notification. We encourage you to review this privacy notice
                frequently to be informed of how we are protecting your information.
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="contact" className="privacy-subtitle">
              13. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
            </div>
            <div className="privacy-body">
              <p>
                If you have questions or comments about this notice, you may contact our Data
                Protection Officer (DPO) by email at address@CountryX.org, or by post to:
              </p>
              <p>
                CountryX
                <br />
                1 United Nations Plaza
                <br />
                New York, New York, United States
              </p>
              <p>
                <b>
                  If you are a resident in the European Economic Area, the "data controller" of your
                  personal information is CountryX. United Nations Development Programme has
                  appointed DPO to be its representative in the EEA. You can contact them directly
                  regarding the processing of your information by United Nations Development
                  Programme, or by post to:
                </b>
              </p>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col span={20}>
            <div id="request" className="privacy-subtitle">
              14. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?
            </div>
            <div className="privacy-body">
              <p>
                Based on the applicable laws of your country, you may have the right to request
                access to the personal information we collect from you, change that information, or
                delete it in some circumstances. To request to review, update, or delete your
                personal information, please submit a request form by clicking{' '}
                <a href="https://docs.google.com/forms/d/e/1FAIpQLScXGu4mARihriinKRbeUXdc5zURgXkA4jvQS0-M1Z40m-KBOA/viewform">
                  here.
                </a>
              </p>
              <p>
                This privacy policy was created using Termly's{' '}
                <a href="https://termly.io/products/privacy-policy-generator/">
                  Privacy Policy Generator.
                </a>
              </p>
            </div>
          </Col>
        </Row>
      </div>
      <LayoutFooter />
    </div>
  );
};

export default PrivacyPolicy;

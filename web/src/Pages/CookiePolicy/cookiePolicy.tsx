import { Button, Col, Divider, Form, Input, message, Row, Select, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import sliderLogo from '../../Assets/Images/logo-slider.png';
import './cookiePolicy.scss';
import { CcCircle } from 'react-bootstrap-icons';
import LayoutFooter from '../../Components/Footer/layout.footer';
const CookiePolicy = () => {
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
    <div className="cookie-container">
      <Row>
        <Col span={24}>
          <div onClick={() => navigate('/')} className="cookie-header-container">
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
      <div className="cookie-body-container">
        <Row>
          <Col sm={24} md={24} lg={24}>
            <div className="cookietitle">SAMPLE COOKIE POLICY</div>
            <div className="cookie-sub">Last updated February 02, 2023</div>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body">
                  This Cookie Policy explains how {process.env.REACT_APP_COUNTRY_NAME || 'CountryX'}{' '}
                  (<b>"Company"</b>, "<b>we</b>", "<b>us</b>", and "<b>our</b>") uses cookies and
                  similar technologies to recognize you when you visit our websites at{' '}
                  <a target="_blank" href="https://carbreg.org">
                    https://carbreg.org
                  </a>
                  , ("<b>Websites</b>"). It explains what these technologies are and why we use
                  them, as well as your rights to control our use of them.
                  <div>
                    In some cases we may use cookies to collect personal information, or that
                    becomes personal information if we combine it with other information.
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col sm={24} md={24} lg={24}>
            <div className="cookie-subtitle">What are cookies?</div>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body">
                  Cookies are small data files that are placed on your computer or mobile device
                  when you visit a website. Cookies are widely used by website owners in order to
                  make their websites work, or to work more efficiently, as well as to provide
                  reporting information.
                  <br /> Cookies set by the website owner (in this case,{' '}
                  {process.env.REACT_APP_COUNTRY_NAME || 'CountryX'}) are called "first party
                  cookies". Cookies set by parties other than the website owner are called "third
                  party cookies". Third party cookies enable third party features or functionality
                  to be provided on or through the website (e.g. like advertising, interactive
                  content and analytics). The parties that set these third party cookies can
                  recognize your computer both when it visits the website in question and also when
                  it visits certain other websites.
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col sm={24} md={24} lg={24}>
            <div className="cookie-subtitle">Why do we use cookies?</div>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body">
                  We use first and third party cookies for several reasons. Some cookies are
                  required for technical reasons in order for our Websites to operate, and we refer
                  to these as "essential" or "strictly necessary" cookies. Other cookies also enable
                  us to track and target the interests of our users to enhance the experience on our
                  Online Properties. Third parties serve cookies through our Websites for
                  advertising, analytics and other purposes. This is described in more detail below.
                  <br /> The specific types of first and third party cookies served through our
                  Websites and the purposes they perform are described below
                  <br /> (please note that the specific cookies served may vary depending on the
                  specific Online Properties you visit):
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col sm={24} md={24} lg={24}>
            <div className="cookie-subtitle">How can I control cookies?</div>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body">
                  You have the right to decide whether to accept or reject cookies. You can exercise
                  your cookie rights by setting your preferences in the Cookie Consent Manager. The
                  Cookie Consent Manager allows you to select which categories of cookies you accept
                  or reject. Essential cookies cannot be rejected as they are strictly necessary to
                  provide you with services.
                  <br /> The Cookie Consent Manager can be found in the notification banner and on
                  our website. If you choose to reject cookies, you may still use our website though
                  your access to some functionality and areas of our website may be restricted. You
                  may also set or amend your web browser controls to accept or refuse cookies. As
                  the means by which you can refuse cookies through your web browser controls vary
                  from browser-to-browser, you should visit your browser's help menu for more
                  information.
                  <br /> In addition, most advertising networks offer you a way to opt out of
                  targeted advertising. If you would like to find out more information, please visit
                  <a target="_blank" href="http://www.aboutads.info/choices/">
                    {' '}
                    http://www.aboutads.info/choices/
                  </a>{' '}
                  or
                  <a target="_blank" href="http://www.youronlinechoices.com">
                    {' '}
                    http://www.youronlinechoices.com
                  </a>
                  .
                  <br /> The specific types of first and third party cookies served through our
                  Websites and the purposes they perform are described in the table below (please
                  note that the specific cookies served may vary depending on the specific Online
                  Properties you visit):
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col sm={24} md={24} lg={24}>
            <div className="cookie-card-subtitle">Essential website cookies:</div>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-subtitle-text">
                  These cookies are strictly necessary to provide you with services available
                  through our Websites and to use some of its features, such as access to secure
                  areas.
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>JSESSIONID</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>
                        Used to maintain an anonymous user session by the server in Java™ 2 Platform
                        Enterprise Edition web applications.
                        <br /> It is a necessary cookie that expires at the end of a session.
                      </td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>.nr-data.net</td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>
                        JavaServer Pages Technologies{' '}
                        <a
                          target="_blank"
                          href="https://www.oracle.com/legal/privacy/privacy-policy.html"
                        >
                          View Service Privacy Policy
                        </a>{' '}
                      </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>____________</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>server_cookie</td>
                    </tr>
                    <tr>
                      <td>Expires in:</td>
                      <td>session</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>_GRECAPTCHA</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>
                        Used to filter spam traffic and allow only legitimate visitors to use
                        Termly's services.
                      </td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>www.google.com</td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>
                        reCAPTCHA{' '}
                        <a target="_blank" href="https://policies.google.com/privacy">
                          {' '}
                          View Service Privacy Policy
                        </a>{' '}
                      </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>United States</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>http_cookie</td>
                    </tr>

                    <tr>
                      <td>Expires in:</td>
                      <td>5 months 27 days</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>__tlbcpv</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>Used to record unique visitor views of the consent banner.</td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>.termly.io</td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>
                        Termly{' '}
                        <a target="_blank" href="https://termly.io/our-privacy-policy/">
                          View Service Privacy Policy
                        </a>{' '}
                      </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>United States</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>http_cookie</td>
                    </tr>
                    <tr>
                      <td>Expires in:</td>
                      <td>1 year</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col sm={24} md={24} lg={24}>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-subtitle">Analytics and customization cookies:</div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-subtitle-text">
                  These cookies collect information that is used either in aggregate form to help us
                  understand how our Websites are being used or how effective our marketing
                  campaigns are, or to help us customize our Websites for you.
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>NRJS-5a07f0452f675c44963</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>__________</td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>
                        <a href="https://carbreg.org">https://carbreg.org</a>/
                      </td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>__________ </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>United States</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>pixel_tracker</td>
                    </tr>
                    <tr>
                      <td>Expires in:</td>
                      <td>session</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>_ga</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>
                        It records a particular ID used to come up with data about website usage by
                        the user. It is a HTTP cookie that expires after 2 years.
                      </td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>.carbreg.org</td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>
                        Google Analytics{' '}
                        <a target="_blank" href="https://policies.google.com/technologies/ads">
                          View Service Privacy Policy
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>United States</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>http_cookie</td>
                    </tr>
                    <tr>
                      <td>Expires in:</td>
                      <td>1 year 11 months 29 days</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>_ga_#</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>
                        Used to distinguish individual users by means of designation of a randomly
                        generated number as client identifier,
                        <br /> which allows calculation of visits and sessions.
                      </td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>.carbreg.org</td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>
                        Google analytics{' '}
                        <a target="_blank" href="https://policies.google.com/technologies/ads">
                          View Service Privacy Policy
                        </a>{' '}
                      </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>United States</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>http_cookie</td>
                    </tr>
                    <tr>
                      <td>Expires in:</td>
                      <td>1 year 11 months 29 days</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col md={24} lg={24}>
            <div className="cookie-card-subtitle">Advertising cookies:</div>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-subtitle-text">
                  These cookies are used to make advertising messages more relevant to you. They
                  perform functions like preventing the same ad from continuously reappearing,
                  ensuring that ads are properly displayed for advertisers, and in some cases
                  selecting advertisements that are based on your interests.
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>a</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>
                        Registers a unique ID that identifies a returning user's device. The ID is
                        used for targeted ads.
                      </td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>
                        <a href="https://carbreg.org">https://carbreg.org</a>
                      </td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>
                        Cox Digital Solutions (Fomerly Adify){' '}
                        <a target="_blank" href="https://www.novomotus.com/privacy-policy/">
                          View Service Privacy Policy
                        </a>{' '}
                      </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>United States</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>pixel_tracker</td>
                    </tr>
                    <tr>
                      <td>Expires in:</td>
                      <td>session</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>_fbp</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>
                        Facebook tracking pixel used to identify visitors for personalized
                        advertising.
                      </td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>.carbreg.org</td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>
                        Facebook{' '}
                        <a
                          target="_blank"
                          href="https://www.facebook.com/privacy/policy/?entry_point=data_policy_redirect&entry=0"
                        >
                          View Service Privacy Policy
                        </a>{' '}
                      </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>United States</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>http_cookie</td>
                    </tr>
                    <tr>
                      <td>Expires in:</td>
                      <td>2 months 29 days</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col md={24} lg={24}>
            <div className="cookie-card-subtitle">Unclassified cookies:</div>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-subtitle-text">
                  These are cookies that have not yet been categorized. We are in the process of
                  classifying these cookies with the help of their providers.
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-card-container">
                  <table>
                    <tr>
                      <td>Name:</td>
                      <td>_grecaptcha</td>
                    </tr>
                    <tr>
                      <td>Purpose:</td>
                      <td>__________</td>
                    </tr>
                    <tr>
                      <td>Provider:</td>
                      <td>
                        <a href="https://carbreg.org">https://carbreg.org</a>
                      </td>
                    </tr>
                    <tr>
                      <td>Service:</td>
                      <td>__________ </td>
                    </tr>
                    <tr>
                      <td>Country:</td>
                      <td>Ireland</td>
                    </tr>
                    <tr>
                      <td>Type:</td>
                      <td>html_local_storage</td>
                    </tr>
                    <tr>
                      <td>Expires in:</td>
                      <td>persistent</td>
                    </tr>
                  </table>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col md={24} lg={24}>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-subtitle">
                  What about other tracking technologies, like web beacons?
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body">
                  Cookies are not the only way to recognize or track visitors to a website. We may
                  use other, similar technologies from time to time, like web beacons (sometimes
                  called "tracking pixels" or "clear gifs"). These are tiny graphics files that
                  contain a unique identifier that enable us to recognize when someone has visited
                  our Websites or opened an e-mail including them. This allows us, for example, to
                  monitor the traffic patterns of users from one page within a website to another,
                  to deliver or communicate with cookies, to understand whether you have come to the
                  website from an online advertisement displayed on a third-party website, to
                  improve site performance, and to measure the success of e-mail marketing
                  campaigns. In many instances, these technologies are reliant on cookies to
                  function properly, and so declining cookies will impair their functioning.
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-subtitle">
                  Do you use Flash cookies or Local Shared Objects?
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body">
                  Websites may also use so-called "Flash Cookies" (also known as Local Shared
                  Objects or "LSOs") to, among other things, collect and store information about
                  your use of our services, fraud prevention and for other site operations.
                  <br /> If you do not want Flash Cookies stored on your computer, you can adjust
                  the settings of your Flash player to block Flash Cookies storage using the tools
                  contained in the{' '}
                  <a
                    target="_blank"
                    href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager07.html"
                  >
                    Website Storage Settings Panel
                  </a>
                  . You can also control Flash Cookies by going to the{' '}
                  <a
                    target="_blank"
                    href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager03.html"
                  >
                    Global Storage Settings Panel
                  </a>{' '}
                  and following the instructions (which may include instructions that explain, for
                  example, how to delete existing Flash Cookies (referred to "information" on the
                  Macromedia site), how to prevent Flash LSOs from being placed on your computer
                  without your being asked, and (for Flash Player 8 and later) how to block Flash
                  Cookies that are not being delivered by the operator of the page you are on at the
                  time).
                  <br /> Please note that setting the Flash Player to restrict or limit acceptance
                  of Flash Cookies may reduce or impede the functionality of some Flash
                  applications, including, potentially, Flash applications used in connection with
                  our services or online content.
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col md={24} lg={24}>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-subtitle">Do you serve targeted advertising?</div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body">
                  Third parties may serve cookies on your computer or mobile device to serve
                  advertising through our Websites. These companies may use information about your
                  visits to this and other websites in order to provide relevant advertisements
                  about goods and services that you may be interested in. They may also employ
                  technology that is used to measure the effectiveness of advertisements. This can
                  be accomplished by them using cookies or web beacons to collect information about
                  your visits to this and other sites in order to provide relevant advertisements
                  about goods and services of potential interest to you. The information collected
                  through this process does not enable us or them to identify your name, contact
                  details or other details that directly identify you unless you choose to provide
                  these.
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col md={24} lg={24}>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-subtitle">How often will you update this Cookie Policy?</div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body">
                  We may update this Cookie Policy from time to time in order to reflect, for
                  example, changes to the cookies we use or for other operational, legal or
                  regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay
                  informed about our use of cookies and related technologies.
                  <br /> The date at the top of this Cookie Policy indicates when it was last
                  updated.
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col md={24} lg={24}>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-subtitle">Where can I get further information?</div>
              </Col>
            </Row>
            <Row justify="center">
              <Col span={20}>
                <div className="cookie-body-contact">
                  If you have any questions about our use of cookies or other technologies, please
                  email us at digital@undp.org or by post to:
                  <br />
                  <br />
                  <br />
                  {process.env.REACT_APP_COUNTRY_NAME || 'CountryX'}
                  <br />1 United Nations Plaza
                  <br />
                  New York, New York
                  <br />
                  United States
                  <br />
                  Phone: +260-211-263258
                  <br />
                  <br />
                  This cookie policy was created using Termly's{' '}
                  <a href="https://termly.io/products/cookie-consent-manager/">
                    Cookie Consent Manager
                  </a>
                  .
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
      <LayoutFooter />
    </div>
  );
};

export default CookiePolicy;

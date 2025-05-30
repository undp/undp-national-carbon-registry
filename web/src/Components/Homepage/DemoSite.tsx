import React from 'react';
import './Dashboard.scss';
import i18next from "i18next";
import { Trans, useTranslation } from "react-i18next";

const DemoSite = () => {
      const { i18n, t } = useTranslation(["common", "homepage"]);
  return (
    <div className="demo-site-container">
                <h1 className="header-title">{t("homepage:demoSiteTitle")}</h1>
      {/*<div className="demo-site-card"></div>*/}

        
        <div className="demo-site-content">
          
          <div className="demo-site-text">
            <p className="main-description">
              This demo site showcases core features developed. The demo site is available by invitation to governments and potential partners working with UNDP. For inquiries and to request a demo, please contact{' '}
              <b><a href="#" className="link">UNDP Digital For Planet</a> </b>via your country office or{' '}
              <u><a href="mailto:digital4planet@undp.org" className="link">digital4planet@undp.org</a></u>
            </p>
            
            <p className="secondary-description">
              Through UNDP country offices, governments can:
            </p>
            
            <ul className="feature-list">
              <li>Request access to the demo site.</li>
              <li>Schedule a live demonstration.</li>
              <li>Explore potential collaboration and support.</li>
            </ul>
            
            <p className="footer-text">
              More technical information can be found on our{' '}
              <u><a href="#" className="link">Github</a></u> page.
            </p>
          </div>
        </div>
      </div>
  );
};

export default DemoSite;
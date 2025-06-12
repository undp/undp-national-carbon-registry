import React from "react";
import "./Dashboard.scss";
import i18next from "i18next";
import { Trans, useTranslation } from "react-i18next";

const DemoSite = () => {
  const { i18n, t } = useTranslation(["common", "homepage"]);
  return (
    <div className="demo-site-container">
      <h1 className="header-title">{t("homepage:demoSiteTitle")}</h1>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 0,
          paddingTop: "56.2500%",
          paddingBottom: 0,
          boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)",
          marginTop: "1.6em",
          marginBottom: "0.9em",
          overflow: "hidden",
          borderRadius: "8px",
          willChange: "transform"
        }}
      >
        <iframe
          loading="lazy"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            border: "none",
            padding: 0,
            margin: 0
          }}
          src="https://www.canva.com/design/DAGp5iEx29Q/yCCaXj1wkWWl-QHPT3yejQ/watch?embed"
          allowFullScreen={true}
          allow="fullscreen"
        />
      </div>
      <a
        href="https:&#x2F;&#x2F;www.canva.com&#x2F;design&#x2F;DAGp5iEx29Q&#x2F;yCCaXj1wkWWl-QHPT3yejQ&#x2F;watch?utm_content=DAGp5iEx29Q&amp;utm_campaign=designshare&amp;utm_medium=embeds&amp;utm_source=link"
        target="_blank"
        rel="noopener"
      >
        Copy of Carbon Registry Demonstration Video
      </a>

      <div className="demo-site-content">
        <div className="demo-site-text">
          <p className="main-description">
            This demo site showcases core features developed. The demo site is
            available by invitation to governments and potential partners
            working with UNDP. For inquiries and to request a demo, please
            contact <b>UNDP Digital For Planet </b>via your country office at{" "}
            <u>
              <a href="mailto:digital4planet@undp.org" className="link">
                digital4planet@undp.org
              </a>
            </u>
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
            More technical information can be found on our{" "}
            <u>
              <a
                href="https://github.com/undp/carbon-registry"
                target="_blank"
                className="link"
              >
                Github
              </a>
            </u>{" "}
            page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoSite;

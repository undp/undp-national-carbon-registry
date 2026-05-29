import React from "react";
import { Mail, CheckCircle, Hammer, Wallet, LucideClipboardList } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

// Invisible SVG that defines the linear gradient
const GradientDefs = () => (
  <svg width="0" height="0">
    <defs>
      <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0063AC" />
        <stop offset="100%" stopColor="#003257" />
      </linearGradient>
    </defs>
  </svg>
);

const ProcessFlow = () => {
  const { i18n, t } = useTranslation(["common", "homepage"]);
  return (
    <div className="process-flow-container">
      {/* Inject the gradient definition once */}
      <GradientDefs />

      <h2 className="process-flow-title">Example process flow</h2>
      <p className="process-flow-subtitle">{t("homepage:HdiwBody")}</p>
      <div className="process-flow">
        {/* Step 1 */}
        <div className="step-card card1">
          <div className="step-header">
            <div className="step-icon">
              <Mail size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">{t("homepage:feature1Title")}</h3>
          <p className="step-description">
            {t("homepage:feature1Description")}
          </p>
        </div>

        {/* Step 2 */}
        <div className="step-card card2">
          <div className="step-header">
            <div className="step-icon">
              <CheckCircle size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">{t("homepage:feature2Title")}</h3>
          <p className="step-description">
            {t("homepage:feature2Description")}
          </p>
        </div>

        {/* Step 3 */}
        <div className="step-card card3">
          <div className="step-header">
            <div className="step-icon">
              <Hammer size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">{t("homepage:feature3Title")}</h3>
          <p className="step-description">
            {t("homepage:feature3Description")}
          </p>
        </div>

        {/* Step 4 */}
        <div className="step-card card4">
          <div className="step-header">
            <div className="step-icon">
              <Wallet size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">{t("homepage:feature4Title")}</h3>
          <p className="step-description">
            {t("homepage:feature4Description")}
          </p>
        </div>

        {/* Step 5 */}
        <div className="step-card card5">
          <div className="step-header">
            <div className="step-icon">
              <LucideClipboardList size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">{t("homepage:feature5Title")}</h3>
          <p className="step-description">
            {t("homepage:feature5Description")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessFlow;

import React from "react";
import "./Dashboard.scss";
import {
  LayoutDashboard,
  NotebookText,
  ArrowRightLeftIcon,
  ChartColumnBig,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const FeatureCards = () => {
  const { t } = useTranslation(["homepage"]);
  return (
    <div className="feature-cards-container">
      <h2 className="header-title">Key Features Of The Carbon Registry</h2>

      <div className="feature-cards-grid">
        {/* First Row - 2 Large Cards */}
        <div className="feature-cards-item feature-cards-large">
          <div className="feature-cards-icon">123</div>
          <h3 className="feature-cards-heading">Serial Number (New!)</h3>
          <p className="feature-cards-text">
            Each carbon Credit Receives a Unique Serial Number (ID). The Demo
            Carbon Registry is Aligned to UNFCCC’s Article 6.2 Guidance
            (Decision 6/CMA.4) but Can be Adapted to Other Types of Carbon
            Credits.
          </p>
        </div>

        <div className="feature-cards-item feature-cards-large">
          <div className="feature-cards-icon">
            <ChartColumnBig />
          </div>
          <h3 className="feature-cards-heading">Reporting (New!)</h3>
          <p className="feature-cards-text">
            The Registry Automatically Generates Reports in the Agreed
            Electronic Format (AEF) for Article 6.2 of the Paris Agreement.
          </p>
        </div>

        {/* Second Row - 3 Small Cards */}
        <div className="feature-cards-item feature-cards-small">
          <div className="feature-cards-icon">
            <NotebookText />
          </div>
          <h3 className="feature-cards-heading">Ledger</h3>
          <p className="feature-cards-text">
            All transfers, Retirements, and Cancellations are Immutably Recorded
            Onto a Ledger.
          </p>
        </div>

        <div className="feature-cards-item feature-cards-small">
          <div className="feature-cards-icon">
            <LayoutDashboard />
          </div>
          <h3 className="feature-cards-heading">
            {t("homepage:dashboardAndInsightsTitle")}
          </h3>
          <p className="feature-cards-text">
            {t("homepage:dashboardAndInsightsBody")}
          </p>
        </div>

        <div className="feature-cards-item feature-cards-small">
          <div className="feature-cards-icon">
            <ArrowRightLeftIcon />
          </div>
          <h3 className="feature-cards-heading">
            {t("homepage:interoperableTitle")}
          </h3>
          <p className="feature-cards-text">
            {t("homepage:interoperableBody")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCards;

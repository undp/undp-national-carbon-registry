import React from 'react';
import './Dashboard.scss';
import { LayoutDashboard,Notebook,ArrowRightLeftIcon,ChartColumnBig} from 'lucide-react';

const FeatureCards = () => {
  return (
    <div className="feature-cards-container">
      <h2 className="header-title">Key Features Of The Carbon Registry</h2>
      
      <div className="feature-cards-grid">
        {/* First Row - 2 Large Cards */}
        <div className="feature-cards-item feature-cards-large">
          <div className="feature-cards-icon">
            123
          </div>
          <h3 className="feature-cards-heading">Serial Number (New!)</h3>
          <p className="feature-cards-text">
            Each Carbon Credit Document has a Serial Number (ID). The Demo Carbon 
            Registry is Aligned to UNFCCC's Article 6.4 Guidance Decision 5/CMA.4 (not 
            Limited to) Other Types of Carbon Credits.
          </p>
        </div>

        <div className="feature-cards-item feature-cards-large">
          <div className="feature-cards-icon">
            <ChartColumnBig/>
          </div>
          <h3 className="feature-cards-heading">Reporting (New!)</h3>
          <p className="feature-cards-text">
            The Registry Automatically Generates Reports in the Agreed Electronic 
            Format (AEF) for Article 6.2 of the Paris Agreement.
          </p>
        </div>

        {/* Second Row - 3 Small Cards */}
        <div className="feature-cards-item feature-cards-small">
          <div className="feature-cards-icon">
                <Notebook/>
          </div>
          <h3 className="feature-cards-heading">Ledger</h3>
          <p className="feature-cards-text">
            All Transfers, Retirements, and Cancellations are Immutably Recorded 
            Onto a Ledger.
          </p>
        </div>

        <div className="feature-cards-item feature-cards-small">
          <div className="feature-cards-icon">
            <LayoutDashboard/>
          </div>
          <h3 className="feature-cards-heading">Dashboard & Insights (New!)</h3>
          <p className="feature-cards-text">
            An Interactive Dashboard Visualizes the History of Credits Issued, 
            Transferred, And Active Projects — by Country, Geography, and Organizations.
          </p>
        </div>

        <div className="feature-cards-item feature-cards-small">
          <div className="feature-cards-icon">
            <ArrowRightLeftIcon/>
          </div>
          <h3 className="feature-cards-heading">Interoperable & Exportable Data</h3>
          <p className="feature-cards-text">
            The Data Model is Aligned with the CAD Trust Data Standard and the ITMN 
            Registry Standard Connection Platform. An Open RESTful API Allows for 
            Additional Integrations and Innovation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCards;
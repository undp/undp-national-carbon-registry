import React from 'react';
import { Mail, CheckCircle, Hammer, Wallet } from 'lucide-react';

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
  return (
    <div className="process-flow-container">
      {/* Inject the gradient definition once */}
      <GradientDefs />

      <h2 className="process-flow-title">How Does It Work?</h2>
      <div className="process-flow">

        {/* Step 1 */}
        <div className="step-card card1">
          <div className="step-header">
            <div className="step-icon">
              <Mail size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">Initial Request Phase</h3>
          <p className="step-description">
            Projects Aimed At Reducing Or Removing Carbon Emissions Sign Up To The Registry And Are Assigned An Independent Certifier.
          </p>
        </div>

        {/* Step 2 */}
        <div className="step-card card2">
          <div className="step-header">
            <div className="step-icon">
              <CheckCircle size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">Project Authorisation</h3>
          <p className="step-description">
            After The Project Design Document (PDD) Is Reviewed, The Project Is Officially Authorised And Recorded On The Registry's Ledger.
          </p>
        </div>

        {/* Step 3 */}
        <div className="step-card card3">
          <div className="step-header">
            <div className="step-icon">
              <Hammer size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">Implementation Phase</h3>
          <p className="step-description">
            Once Implemented, Projects Are Monitored, And Emission Reductions Are Reported. Carbon Credits Can Be Issued And Serialised Following Verification.
          </p>
        </div>

        {/* Step 4 */}
        <div className="step-card card4">
          <div className="step-header">
            <div className="step-icon">
              <Wallet size={80} stroke="url(#iconGradient)" />
            </div>
          </div>
          <h3 className="step-title">Credit Transfer & Retirement</h3>
          <p className="step-description">
            Issued Credits Can Be Traded Domestically Or Internationally. Credits Can Be Tracked, Retired Or Cancelled Within The Registry, Ensuring Proper Ownership Transfer And Preventing Double Counting.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ProcessFlow;

import React from 'react';
import { Mail, CheckCircle, Hammer, Folder } from 'lucide-react';
import './Dashboard.scss';

const ProcessFlow = () => {
  const steps = [
    {
      id: 1,
      icon: <Mail size={80} />,
      title: "Initial Request Phase",
      description: "Projects Aimed At Reducing Or Removing Carbon Emissions Sign Up To The Registry And Are Assigned An Independent Certifier."
    },
    {
      id: 2,
      icon: <CheckCircle size={80} />,
      title: "Project Authorisation",
      description: "After The Project Design Document (PDD) Is Reviewed, The Project Is Officially Authorised And Recorded On The Registry's Ledger."
    },
    {
      id: 3,
      icon: <Hammer size={80} />,
      title: "Implementation Phase",
      description: "Once Implemented, Projects Are Monitored, And Emission Reductions Are Reported. Carbon Credits Can Be Issued And Serialised Following Verification."
    },
    {
      id: 4,
      icon: <Folder size={80} />,
      title: "Credit Transfer & Retirement",
      description: "Issued Credits Can Be Traded Domestically Or Internationally. Credits Can Be Tracked, Retired Or Cancelled Within The Registry, Ensuring Proper Ownership Transfer And Preventing Double Counting."
    }
  ];

  return (
    <div className="process-flow-container">
      <h2 className="process-flow-title">How Does It Work?</h2>
      <div className="process-flow">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="step-card">
              <div className="step-header">
                <div className="step-icon">
                  {step.icon}
                </div>
                
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="arrow-connector">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 5L19 12L12 19" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProcessFlow;
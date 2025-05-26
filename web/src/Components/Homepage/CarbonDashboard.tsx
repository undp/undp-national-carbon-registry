import React, { useState, useEffect } from 'react';
import './Dashboard.scss';

const CarbonDashboard = () => {
  const [projectCount, setProjectCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const targetCount = 228;
    const duration = 4000; 
    const startTime = Date.now();
    
    const animateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * targetCount);
      
      setProjectCount(currentCount);
      setIsAnimating(true);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 100);
      
      if (progress < 1) {
        requestAnimationFrame(animateCounter);
      } else {
        setProjectCount(targetCount);
      }
    };

    // Start animation after a short delay
    const timer = setTimeout(() => {
      animateCounter();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const projectData = [
    { value: 150, title: 'Authorised' },
    { value: 50, title: 'Pending' },
    { value: 28, title: 'Rejected' }
  ];

  const creditData = [
    { value: 345890, title: 'Authorised' },
    { value: 200890, title: 'Issued' },
    { value: 100890, title: 'Transferred' },
    { value: 120890, title: 'Retired' }
  ];

  return (
    <div className="carbon-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h2 className="header-title">
            Why Carbon Registries?
          </h2>
        </div>

        {/* Main Card with Title and Statistics */}
        <div className="main-card">
          <div className="main-card-content">
            <div className="main-title-container">
              <h1 className="main-title">
                All in One Carbon Management Platform and Dashboard for Countries
              </h1>
            </div>
            <div className="stats-container">
              <div className="stats-wrapper">
                <div className="main-statistic procount">
                  <div className={`statistic-value ${isAnimating ? 'counting' : ''}`}>
                    {projectCount.toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    Total Projects
                  </div>
                </div>
                <div className="main-statistic">
                  <div className="statistic-value">
                    {(345890).toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    Total Credits
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Distribution Section */}
        <div className="section">
          <h3 className="section-title">
            Project Distribution by Status
          </h3>
          <div className="cards-grid cards-grid-3">
            {projectData.map((item, index) => (
              <div key={index} className="project-card">
                <div className="project-statistic">
                  <div className="project-value">
                    {item.value}
                  </div>
                  <div className="project-title">
                    {item.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carbon Credit Distribution Section */}
        <div className="section">
          <h3 className="section-title">
            Carbon Credit Distribution by Status
          </h3>
          <div className="cards-grid cards-grid-4">
            {creditData.map((item, index) => (
              <div key={index} className="credit-card">
                <div className="credit-statistic">
                  <div className="credit-value">
                    {item.value.toLocaleString()}
                  </div>
                  <div className="credit-title">
                    {item.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Text */}
        <div className="footer-section">
          <p className="footer-text">
            The Paris Agreement is an international treaty on climate change aiming to limit global warming to below 2°C, with efforts to keep it to 1.5°C by 2100. Article 6 introduces mechanisms for countries to cooperate on climate goals through market-based (Articles 6.2 and 6.4) and non-market approaches (Article 6.8). All countries must account for any carbon credits used or transferred within their Nationally Determined Contributions (NDCs).<b> Digital carbon registries are essential for countries to track and manage carbon credits, ensuring data integrity and enabling consistent reporting.</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CarbonDashboard;
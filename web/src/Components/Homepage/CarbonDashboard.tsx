import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import './Dashboard.scss';

const CarbonDashboard = () => {
  const [projectCount, setProjectCount] = useState(0);
  const [creditCount, setCreditCount] = useState(300000);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef(null);

  const animateCounters = useCallback(() => {
    const targetProjectCount = 228;
    const targetCreditCount = 345890;
    const startingCreditCount = 300000;
    const duration = 1500;
    const startTime = Date.now();
    
    const updateCounters = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      // Update project count
      const currentProjectCount = Math.floor(easeOutQuart * targetProjectCount);
      setProjectCount(currentProjectCount);
      
      // Update credit count
      const creditDifference = targetCreditCount - startingCreditCount;
      const currentCreditCount = Math.floor(startingCreditCount + (easeOutQuart * creditDifference));
      setCreditCount(currentCreditCount);
      
      setIsAnimating(progress < 1);
      
      if (progress < 1) {
        requestAnimationFrame(updateCounters);
      } else {
        setProjectCount(targetProjectCount);
        setCreditCount(targetCreditCount);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(updateCounters);
  }, []); 

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounters();
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [animateCounters, hasAnimated]); 

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
            <div className="stats-container" ref={statsRef}>
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
                  <div className={`statistic-value ${isAnimating ? 'counting' : ''}`}>
                    {creditCount.toLocaleString()}
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
          <motion.div
          className='cards-grid cards-grid-3'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          viewport={{ once: true }}
          >
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
          </motion.div>
        </div>

        {/* Carbon Credit Distribution Section */}
        <div className="section">
          <h3 className="section-title">
            Carbon Credit Distribution by Status
          </h3>
          <motion.div
          className='cards-grid cards-grid-4'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          viewport={{ once: true }}
          >
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
            ))}</motion.div>
        </div>

        {/* Footer Text */}
        <div className="footer-section">
          <p className="footer-text">
            The Paris Agreement is an international treaty on climate change aiming to limit global warming to below 2°C, with efforts to keep it to 1.5°C by 2100. Article 6 introduces mechanisms for countries to cooperate on climate goals through market-based (Articles 6.2 and 6.4) and non-market approaches (Article 6.8). All countries must account for any carbon credits used or transferred within their Nationally Determined Contributions (NDCs).<b> Digital carbon registries are essential for countries to track and manage carbon credits, ensuring data integrity and enable consistent reporting.</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CarbonDashboard;
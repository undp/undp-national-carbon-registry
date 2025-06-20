import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Trans, useTranslation } from "react-i18next";
import "./Dashboard.scss";

const CarbonDashboard = () => {
  const { i18n, t } = useTranslation(["common", "homepage"]);
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
      const currentCreditCount = Math.floor(
        startingCreditCount + easeOutQuart * creditDifference
      );
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
        rootMargin: "0px 0px -50px 0px",
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
    { value: 150, title: t("homepage:authorised") },
    { value: 50, title: t("homepage:pending") },
    { value: 28, title: t("homepage:rejected") },
  ];

  const creditData = [
    { value: 345890, title: t("homepage:authorised") },
    { value: 200890, title: t("homepage:issued") },
    { value: 100890, title: t("homepage:transferred") },
    { value: 120890, title: t("homepage:retired") },
  ];

  return (
    <div className="carbon-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h2 className="header-title">{t("homepage:dashboardtitle")}</h2>
        </div>

        {/* Main Card with Title and Statistics */}
        <div className="main-card">
          <div className="main-card-content">
            <div className="main-title-container">
              <h1 className="main-title">{t("homepage:allinoneplatform")}</h1>
            </div>
            <div className="stats-container" ref={statsRef}>
              <div className="stats-wrapper">
                <div className="main-statistic procount">
                  <div
                    className={`statistic-value ${
                      isAnimating ? "counting" : ""
                    }`}
                  >
                    {projectCount.toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    {t("homepage:totprojects")}
                  </div>
                </div>
                <div className="main-statistic">
                  <div
                    className={`statistic-value ${
                      isAnimating ? "counting" : ""
                    }`}
                  >
                    {creditCount.toLocaleString()}
                  </div>
                  <div className="statistic-title">
                    {t("homepage:totcredits")}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="main-card-example-section">
            <div className="example">{t("homepage:example")}</div>
          </div>
        </div>

        {/* Project Distribution Section */}
        <div className="section">
          <h3 className="section-title">{t("homepage:projectdistribution")}</h3>
          <motion.div
            className="cards-grid cards-grid-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {projectData.map((item, index) => (
              <div key={index} className="project-card">
                <div className="project-statistic">
                  <div className="project-value">{item.value}</div>
                  <div className="project-title">{item.title}</div>
                </div>
                <div className="project-card-example example">
                  {t("homepage:example")}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Carbon Credit Distribution Section */}
        <div className="section">
          <h3 className="section-title">
            {t("homepage:distributionbystatus")}
          </h3>
          <motion.div
            className="cards-grid cards-grid-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {creditData.map((item, index) => (
              <div key={index} className="credit-card">
                <div className="credit-statistic">
                  <div className="credit-value">
                    {item.value.toLocaleString()}
                  </div>
                  <div className="credit-title">{item.title}</div>
                </div>
                <div className="credit-card-example example">
                  {t("homepage:example")}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer Text */}
        <div className="footer-section">
          <p className="footer-text">
            {t("homepage:policyContextBody")}
            <b> {t("homepage:policyContextBody2")}</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CarbonDashboard;

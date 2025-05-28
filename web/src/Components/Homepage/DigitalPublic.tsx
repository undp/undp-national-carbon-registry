import React from 'react';
import { motion } from 'framer-motion';
import './Dashboard.scss';
import publicGoodImage from "../../Assets/Images/public-good.jpg";
import { Trans, useTranslation } from "react-i18next";

const DigitalPublicGood = () => {
  const { i18n, t } = useTranslation(["common", "homepage"]);
  return (
    <div className="digital-public-good">
      <h2 className="header-title">{t("homepage:digitalPublicTitle")}</h2>
      
      <div className="image-containers">
        <img src={publicGoodImage} alt="A Digital Public Good" className="main-image" />

        <motion.div
          className="image-caption"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          {t("homepage:digitalPublicBody")}
        </motion.div>
      </div>
    </div>
  );
};

export default DigitalPublicGood;

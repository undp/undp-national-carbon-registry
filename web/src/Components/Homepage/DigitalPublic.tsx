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
          In response to countries’ need for support, UNDP has created the National Carbon Credit Registry as an open-source toolkit that follows the <a href="https://digitalpublicgoods.net/digital-public-goods/" target="_blank">Digital Public Goods Standard.</a> Countries can access the free, open-source code and installation instructions <a href ='https://github.com/undp/carbon-registry' target="_blank">from UNDP’s managed Github</a> to customize a Registry according to their national needs. This approach helps save time, reduce costs, and avoids duplication of effort.

        </motion.div>
      </div>
    </div>
  );
};

export default DigitalPublicGood;
